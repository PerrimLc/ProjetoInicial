using SaaSAgents.Api.Models;

namespace SaaSAgents.Api.Data;

public static class SeedData
{
    public static async Task SeedAsync(AppDbContext db)
    {
        if (db.Users.Any()) return;

        var user = new User
        {
            Name = "Arthur Neves",
            Email = "admin@demo.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"),
            Role = "admin",
            Phone = "+55 11 99999-8888",
            Company = "AgentAI Ltda.",
            Website = "https://agentai.com.br",
            Plan = "Pro",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        // Settings
        db.Settings.Add(new CompanySettings
        {
            UserId = user.Id,
            CompanyName = "AgentAI Ltda.",
            CompanyEmail = "contato@agentai.com.br",
            CompanyPhone = "+55 11 3000-0000",
            CompanyWebsite = "https://agentai.com.br",
            DefaultModel = "GPT-4o",
            DefaultTemperature = 0.7,
            DefaultPrompt = "Você é um assistente de vendas especializado em ajudar clientes a encontrar a melhor solução.",
            WhatsappConnected = true,
            NotificationsEnabled = true,
        });

        // Agents
        var agents = new List<Agent>
        {
            new() { UserId = user.Id, Name = "Aria", Description = "Especialista em atendimento ao cliente, resolve dúvidas e suporte técnico com empatia.", Goal = "Atendimento", Tone = "empático", Model = "GPT-4o", Temperature = 0.7, IsActive = true, Color = "#8B5CF6", ConversationCount = 1284, BasePrompt = "Você é Aria, uma assistente de atendimento..." },
            new() { UserId = user.Id, Name = "Max", Description = "Agente focado em conversão de leads, qualificação e fechamento de negócios.", Goal = "Vendas", Tone = "persuasivo", Model = "GPT-4o", Temperature = 0.8, IsActive = true, Color = "#06B6D4", ConversationCount = 956, BasePrompt = "Você é Max, especialista em vendas..." },
            new() { UserId = user.Id, Name = "Luna", Description = "Prospecção ativa, qualificação de leads e agendamento de reuniões comerciais.", Goal = "SDR", Tone = "amigável", Model = "GPT-4o", Temperature = 0.6, IsActive = true, Color = "#F59E0B", ConversationCount = 742, BasePrompt = "Você é Luna, SDR especialista..." },
            new() { UserId = user.Id, Name = "Neo", Description = "Suporte técnico especializado, análise de problemas e escalonamento de tickets.", Goal = "Suporte", Tone = "técnico", Model = "GPT-4o", Temperature = 0.4, IsActive = false, Color = "#10B981", ConversationCount = 128, BasePrompt = "Você é Neo, suporte técnico..." },
            new() { UserId = user.Id, Name = "Eva", Description = "Customer Success proativa, onboarding, retenção e upsell de clientes.", Goal = "CS", Tone = "consultivo", Model = "GPT-4o", Temperature = 0.75, IsActive = true, Color = "#EC4899", ConversationCount = 534, BasePrompt = "Você é Eva, customer success..." },
        };
        db.Agents.AddRange(agents);

        // Leads
        var leads = new List<Lead>
        {
            new() { UserId = user.Id, Name = "Rafael Mendes", Company = "TechCorp SA", Phone = "+55 11 99234-5678", Email = "rafael@techcorp.com", Source = "LinkedIn", Status = "negotiation", PipelineStage = "negotiation", EstimatedValue = 48000, Responsible = "Ana Lima", Score = 92 },
            new() { UserId = user.Id, Name = "Carolina Silva", Company = "Inova Solutions", Phone = "+55 21 98765-4321", Email = "carolina@inova.com.br", Source = "Site", Status = "proposal", PipelineStage = "proposal", EstimatedValue = 24000, Responsible = "Carlos Rocha", Score = 78 },
            new() { UserId = user.Id, Name = "Bruno Alves", Company = "Alpha Vendas", Phone = "+55 31 97654-3210", Email = "bruno@alphavendas.com", Source = "Indicação", Status = "qualified", PipelineStage = "qualified", EstimatedValue = 36000, Responsible = "Ana Lima", Score = 85 },
            new() { UserId = user.Id, Name = "Mariana Costa", Company = "NextGen Sistemas", Phone = "+55 11 96543-2109", Email = "mariana@nextgen.io", Source = "Google Ads", Status = "new", PipelineStage = "new", EstimatedValue = 96000, Responsible = "Pedro Matos", Score = 65 },
            new() { UserId = user.Id, Name = "Pedro Rodrigues", Company = "Fortis Technology", Phone = "+55 85 95432-1098", Email = "pedro@fortis.tech", Source = "LinkedIn", Status = "closed", PipelineStage = "closed", EstimatedValue = 72000, Responsible = "Carlos Rocha", Score = 98 },
            new() { UserId = user.Id, Name = "Beatriz Ferreira", Company = "Pulse Digital", Phone = "+55 11 94321-0987", Email = "beatriz@pulse.digital", Source = "Webinar", Status = "qualified", PipelineStage = "qualified", EstimatedValue = 18000, Responsible = "Ana Lima", Score = 72 },
            new() { UserId = user.Id, Name = "Lucas Oliveira", Company = "Apex Corp", Phone = "+55 41 93210-9876", Email = "lucas@apex.corp", Source = "Site", Status = "proposal", PipelineStage = "proposal", EstimatedValue = 54000, Responsible = "Pedro Matos", Score = 81 },
            new() { UserId = user.Id, Name = "Fernanda Lima", Company = "Sigma Startups", Phone = "+55 11 92109-8765", Email = "fernanda@sigma.vc", Source = "Cold Outreach", Status = "new", PipelineStage = "new", EstimatedValue = 120000, Responsible = "Carlos Rocha", Score = 58 },
        };
        db.Leads.AddRange(leads);
        await db.SaveChangesAsync();

        // Conversations with messages
        var conv1 = new Conversation
        {
            UserId = user.Id, LeadId = leads[0].Id,
            ContactName = "Rafael Mendes", ContactPhone = "+55 11 99234-5678", ContactCompany = "TechCorp",
            Status = "active", AgentName = "Aria", UnreadCount = 2,
        };
        db.Conversations.Add(conv1);
        await db.SaveChangesAsync();

        db.Messages.AddRange(
            new Message { ConversationId = conv1.Id, Content = "Olá! Gostaria de saber mais sobre os planos.", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-25) },
            new Message { ConversationId = conv1.Id, Content = "Olá Rafael! Fico feliz em ajudar 😊 Temos 3 planos: Starter, Pro e Enterprise. Qual o tamanho da sua equipe?", Sender = "ai", Timestamp = DateTime.UtcNow.AddMinutes(-24) },
            new Message { ConversationId = conv1.Id, Content = "Somos uma equipe de 15 pessoas no comercial.", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-20) },
            new Message { ConversationId = conv1.Id, Content = "Para 15 pessoas, o plano Pro é ideal! Inclui até 20 usuários, todos os agentes de IA, CRM integrado e relatórios avançados por R$ 997/mês. Posso agendar uma demo?", Sender = "ai", Timestamp = DateTime.UtcNow.AddMinutes(-18) },
            new Message { ConversationId = conv1.Id, Content = "Sim, pode ser quinta-feira às 14h?", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-10) },
            new Message { ConversationId = conv1.Id, Content = "Perfeito! Agendei para quinta-feira às 14h. Alguma dúvida?", Sender = "ai", Timestamp = DateTime.UtcNow.AddMinutes(-8) },
            new Message { ConversationId = conv1.Id, Content = "Perfeito! Vou aguardar o retorno.", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-5) }
        );

        var conv2 = new Conversation
        {
            UserId = user.Id, LeadId = leads[1].Id,
            ContactName = "Carolina Silva", ContactPhone = "+55 21 98765-4321", ContactCompany = "Inova Solutions",
            Status = "active", AgentName = "Max", UnreadCount = 1,
        };
        db.Conversations.Add(conv2);
        await db.SaveChangesAsync();

        db.Messages.AddRange(
            new Message { ConversationId = conv2.Id, Content = "Boa tarde! Vi vocês no LinkedIn e fiquei interessada.", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-45) },
            new Message { ConversationId = conv2.Id, Content = "Boa tarde, Carolina! Qual é o principal desafio no atendimento hoje?", Sender = "ai", Timestamp = DateTime.UtcNow.AddMinutes(-44) },
            new Message { ConversationId = conv2.Id, Content = "Temos muitos leads sem resposta rápida.", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-40) },
            new Message { ConversationId = conv2.Id, Content = "Exatamente o que resolvemos! Com nossa IA, o lead recebe resposta em menos de 30 segundos, 24/7.", Sender = "ai", Timestamp = DateTime.UtcNow.AddMinutes(-35) },
            new Message { ConversationId = conv2.Id, Content = "Qual o prazo de implementação?", Sender = "user", Timestamp = DateTime.UtcNow.AddMinutes(-12) }
        );

        // Knowledge docs
        db.KnowledgeDocuments.AddRange(
            new KnowledgeDocument { UserId = user.Id, AgentId = agents[0].Id, Title = "Manual do Produto v2.3", Content = "Guia completo sobre funcionalidades, planos e integrações da plataforma AgentAI.", Category = "Produto" },
            new KnowledgeDocument { UserId = user.Id, AgentId = agents[1].Id, Title = "Script de Vendas Q2", Content = "Roteiro para qualificação de leads e apresentação dos planos Starter, Pro e Enterprise.", Category = "Vendas" },
            new KnowledgeDocument { UserId = user.Id, Title = "Políticas de Suporte", Content = "SLAs, horários de atendimento e procedimentos de escalonamento.", Category = "Suporte" },
            new KnowledgeDocument { UserId = user.Id, Title = "FAQ Clientes", Content = "Perguntas frequentes sobre integração WhatsApp, preços e funcionalidades.", Category = "FAQ" }
        );

        // Tasks
        db.Tasks.AddRange(
            new TaskItem { UserId = user.Id, LeadId = leads[0].Id, Title = "Enviar proposta para Rafael Mendes", Description = "Proposta customizada com desconto de 10%", DueDate = DateTime.UtcNow.AddDays(2) },
            new TaskItem { UserId = user.Id, LeadId = leads[1].Id, Title = "Follow-up Carolina Silva", Description = "Verificar interesse após apresentação", DueDate = DateTime.UtcNow.AddDays(1) },
            new TaskItem { UserId = user.Id, Title = "Revisar agentes de IA", Description = "Atualizar prompts dos agentes Aria e Max", DueDate = DateTime.UtcNow.AddDays(5) },
            new TaskItem { UserId = user.Id, ConversationId = conv2.Id, Title = "Responder pergunta sobre prazo", Description = "Informar prazo de 7 dias úteis para implementação", DueDate = DateTime.UtcNow.AddHours(4), IsCompleted = true }
        );

        await db.SaveChangesAsync();
    }
}
