namespace SaaSAgents.Api.Dtos;

public record AgentDto(
    int Id, string Name, string Description, string Goal,
    string Tone, string BasePrompt, string Model,
    double Temperature, bool IsActive, string Color,
    int ConversationCount, DateTime CreatedAt
);

public record CreateAgentDto(
    string Name, string Description, string Goal,
    string Tone, string BasePrompt, string Model,
    double Temperature, bool IsActive, string Color
);

public record UpdateAgentDto(
    string? Name, string? Description, string? Goal,
    string? Tone, string? BasePrompt, string? Model,
    double? Temperature, bool? IsActive, string? Color
);
