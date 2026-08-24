using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace AgentAI.Integrations.WhatsApp
{
    // =====================================================================
    // WhatsAppCloudApiService
    // ---------------------------------------------------------------------
    // Integração com a WhatsApp Business Cloud API (Meta / Graph API).
    // Cobre:
    //   1) Envio de mensagens de texto
    //   2) Envio de mensagens de template (obrigatório fora da janela de 24h)
    //   3) Verificação do Webhook (GET) exigida pela Meta
    //   4) Recebimento e parsing de mensagens (POST) via Webhook
    //
    // Como usar (resumo):
    //   - Configure as credenciais em WhatsAppConfig (ou via appsettings.json /
    //     variáveis de ambiente, o que preferir).
    //   - Instancie o service e chame SendTextMessageAsync / SendTemplateMessageAsync
    //     para enviar mensagens.
    //   - Exponha um endpoint HTTP (Controller/Minimal API) que delegue as
    //     requisições GET e POST do Webhook para HandleWebhookVerification e
    //     ParseIncomingWebhook, respectivamente (exemplo comentado no final
    //     do arquivo).
    //
    // Pré-requisitos (Meta for Developers):
    //   - App configurado no Meta for Developers com o produto "WhatsApp".
    //   - Número de telefone comercial BRASILEIRO registrado (WhatsApp Manager
    //     > Contas do WhatsApp > Registre seu número). Números de teste (US)
    //     não conseguem mandar mensagem para números BR (erro 130497).
    //   - Um USUÁRIO DO SISTEMA criado em Configurações do Negócio > Usuários
    //     > Usuários do sistema, com "Acesso total" atribuído ao app E a
    //     todas as Contas do WhatsApp (WABAs) que forem usadas. Sem isso, a
    //     API retorna erro 401/"Object does not exist... missing permissions"
    //     mesmo com o número corretamente registrado.
    //   - Um Access Token gerado a partir desse Usuário do Sistema (não pelo
    //     botão "Gerar token" da Etapa 1, que é só para o número de teste),
    //     com as permissões whatsapp_business_management e
    //     whatsapp_business_messaging. Esse token dura 60 dias (configurável
    //     para "Nunca" expirar), bem melhor que o temporário de 24h.
    //   - Phone Number ID do número BR registrado (WhatsApp Manager > Contas
    //     do WhatsApp > seu WABA > Phone numbers).
    //   - Um Verify Token (string arbitrária definida por você) configurado
    //     no painel do Webhook da Meta, igual ao usado aqui.
    //   - Webhook assinado ("Assinar webhooks") no card do WABA usado, senão
    //     você não recebe confirmação de status de entrega/falha das mensagens.
    // =====================================================================

    public class WhatsAppConfig
    {
        // ID do número de telefone comercial BR registrado (painel Meta)
        public string PhoneNumberId { get; set; } = string.Empty;

        // Token de acesso (Bearer) gerado a partir de um Usuário do Sistema
        // com "Acesso total" ao app e ao WABA (ver pré-requisitos acima)
        public string AccessToken { get; set; } = string.Empty;

        // Token arbitrário definido por você para validar o Webhook na Meta
        public string VerifyToken { get; set; } = string.Empty;

        // Versão da Graph API (ajuste conforme a mais recente disponível)
        public string ApiVersion { get; set; } = "v25.0";

        public string BaseUrl => $"https://graph.facebook.com/{ApiVersion}/{PhoneNumberId}/messages";
    }

    public class WhatsAppCloudApiService
    {
        private readonly HttpClient _httpClient;
        private readonly WhatsAppConfig _config;

        public WhatsAppCloudApiService(WhatsAppConfig config, HttpClient? httpClient = null)
        {
            _config = config ?? throw new ArgumentNullException(nameof(config));
            _httpClient = httpClient ?? new HttpClient();

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _config.AccessToken);
        }

        // -----------------------------------------------------------------
        // Envio de mensagem de texto simples
        // Só funciona dentro da janela de 24h após a última mensagem do
        // usuário (regra da própria Meta). Fora disso, use template.
        // -----------------------------------------------------------------
        public async Task<WhatsAppSendResult> SendTextMessageAsync(string toPhoneNumber, string message)
        {
            var payload = new
            {
                messaging_product = "whatsapp",
                to = toPhoneNumber,
                type = "text",
                text = new { body = message }
            };

            return await PostToWhatsAppAsync(payload);
        }

        // -----------------------------------------------------------------
        // Envio de mensagem de template (necessário para iniciar conversa
        // fora da janela de 24h, ex: notificações, follow-ups automáticos)
        // O template precisa ter sido previamente aprovado no Meta Business
        // Manager.
        // -----------------------------------------------------------------
        public async Task<WhatsAppSendResult> SendTemplateMessageAsync(
            string toPhoneNumber,
            string templateName,
            string languageCode = "pt_BR",
            List<string>? bodyParameters = null)
        {
            var components = new List<object>();

            if (bodyParameters is { Count: > 0 })
            {
                components.Add(new
                {
                    type = "body",
                    parameters = bodyParameters.ConvertAll(p => (object)new { type = "text", text = p })
                });
            }

            var payload = new
            {
                messaging_product = "whatsapp",
                to = toPhoneNumber,
                type = "template",
                template = new
                {
                    name = templateName,
                    language = new { code = languageCode },
                    components
                }
            };

            return await PostToWhatsAppAsync(payload);
        }

        private async Task<WhatsAppSendResult> PostToWhatsAppAsync(object payload)
        {
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(_config.BaseUrl, content);
            var responseBody = await response.Content.ReadAsStringAsync();

            return new WhatsAppSendResult
            {
                Success = response.IsSuccessStatusCode,
                StatusCode = (int)response.StatusCode,
                RawResponse = responseBody
            };
        }

        // -----------------------------------------------------------------
        // Verificação do Webhook (requisição GET feita pela Meta ao
        // configurar o endpoint no painel do app)
        // -----------------------------------------------------------------
        public string? HandleWebhookVerification(string mode, string token, string challenge)
        {
            if (mode == "subscribe" && token == _config.VerifyToken)
            {
                return challenge; // Deve ser devolvido como corpo da resposta, status 200
            }

            return null; // Se null, o endpoint deve responder 403
        }

        // -----------------------------------------------------------------
        // Parsing do payload recebido via Webhook (requisição POST feita
        // pela Meta a cada mensagem recebida, status de entrega, etc.)
        // -----------------------------------------------------------------
        public List<IncomingWhatsAppMessage> ParseIncomingWebhook(string rawJsonBody)
        {
            var messages = new List<IncomingWhatsAppMessage>();

            using var doc = JsonDocument.Parse(rawJsonBody);
            var root = doc.RootElement;

            if (!root.TryGetProperty("entry", out var entries)) return messages;

            foreach (var entry in entries.EnumerateArray())
            {
                if (!entry.TryGetProperty("changes", out var changes)) continue;

                foreach (var change in changes.EnumerateArray())
                {
                    if (!change.TryGetProperty("value", out var value)) continue;
                    if (!value.TryGetProperty("messages", out var msgArray)) continue;

                    foreach (var msg in msgArray.EnumerateArray())
                    {
                        var from = msg.TryGetProperty("from", out var f) ? f.GetString() : null;
                        var id = msg.TryGetProperty("id", out var i) ? i.GetString() : null;
                        var type = msg.TryGetProperty("type", out var t) ? t.GetString() : null;

                        string? text = null;
                        if (type == "text" && msg.TryGetProperty("text", out var textObj)
                            && textObj.TryGetProperty("body", out var bodyProp))
                        {
                            text = bodyProp.GetString();
                        }

                        messages.Add(new IncomingWhatsAppMessage
                        {
                            MessageId = id,
                            From = from,
                            Type = type,
                            TextBody = text,
                            RawJson = msg.GetRawText()
                        });
                    }
                }
            }

            return messages;
        }
    }

    public class WhatsAppSendResult
    {
        public bool Success { get; set; }
        public int StatusCode { get; set; }
        public string RawResponse { get; set; } = string.Empty;
    }

    public class IncomingWhatsAppMessage
    {
        public string? MessageId { get; set; }
        public string? From { get; set; }
        public string? Type { get; set; }
        public string? TextBody { get; set; }
        public string RawJson { get; set; } = string.Empty;
    }

    // =====================================================================
    // EXEMPLO DE USO (ASP.NET Core - Minimal API)
    // Descomente e adapte ao seu projeto. Deixado como comentário para não
    // interferir na compilação deste arquivo isolado.
    // =====================================================================
    /*
    var builder = WebApplication.CreateBuilder(args);

    // Exemplo de valores reais validados (substitua pelos seus em produção):
    //   PhoneNumberId: "1208734662333799"  (número BR +55 12 99169-4734)
    //   AccessToken:   token gerado a partir do Usuário do Sistema
    //                  "Foxia api integration" (Admin, acesso total ao app
    //                  e a todos os WABAs), válido por 60 dias.
    var whatsAppConfig = new WhatsAppConfig
    {
        PhoneNumberId = builder.Configuration["WhatsApp:PhoneNumberId"]!,
        AccessToken   = builder.Configuration["WhatsApp:AccessToken"]!,
        VerifyToken   = builder.Configuration["WhatsApp:VerifyToken"]!
    };

    builder.Services.AddSingleton(whatsAppConfig);
    builder.Services.AddHttpClient<WhatsAppCloudApiService>();

    var app = builder.Build();

    // Verificação do webhook (Meta faz GET ao salvar a configuração)
    app.MapGet("/webhook/whatsapp", (HttpRequest request, WhatsAppCloudApiService service) =>
    {
        var mode = request.Query["hub.mode"].ToString();
        var token = request.Query["hub.verify_token"].ToString();
        var challenge = request.Query["hub.challenge"].ToString();

        var result = service.HandleWebhookVerification(mode, token, challenge);
        return result is not null ? Results.Text(result) : Results.StatusCode(403);
    });

    // Recebimento de mensagens (Meta faz POST a cada evento)
    app.MapPost("/webhook/whatsapp", async (HttpRequest request, WhatsAppCloudApiService service) =>
    {
        using var reader = new StreamReader(request.Body);
        var body = await reader.ReadToEndAsync();

        var messages = service.ParseIncomingWebhook(body);
        foreach (var msg in messages)
        {
            // TODO: encaminhar para o motor do agente de IA (Projeto Arthur)
            Console.WriteLine($"Mensagem de {msg.From}: {msg.TextBody}");
        }

        return Results.Ok();
    });

    app.Run();
    */
}
