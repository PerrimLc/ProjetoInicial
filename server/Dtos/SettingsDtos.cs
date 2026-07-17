namespace SaaSAgents.Api.Dtos;

public record SettingsDto(
    string CompanyName, string CompanyEmail, string CompanyPhone,
    string CompanyWebsite, bool WhatsappConnected, string OpenAiKey,
    string DefaultModel, double DefaultTemperature, string DefaultPrompt,
    string Language, bool NotificationsEnabled, bool TwoFactor
);

public record UpdateSettingsDto(
    string? CompanyName, string? CompanyEmail, string? CompanyPhone,
    string? CompanyWebsite, bool? WhatsappConnected, string? OpenAiKey,
    string? DefaultModel, double? DefaultTemperature, string? DefaultPrompt,
    string? Language, bool? NotificationsEnabled, bool? TwoFactor
);

public record UpdateProfileDto(
    string? Name, string? Phone,
    string? Company, string? Website
);

public record DashboardDto(
    int TotalLeads, int TotalConversations, int TotalAgents,
    int ActiveAgents, int OpenTasks, int ClosedLeads,
    decimal TotalRevenue, double ConversionRate,
    List<ChartPointDto> ConversationChart,
    List<ChartPointDto> RevenueChart
);

public record ChartPointDto(string Name, double Value, double? Value2 = null);

public record AiRespondDto(int ConversationId, int AgentId, string Message);
public record AiResponseResultDto(string Response, bool UsedOpenAi);
