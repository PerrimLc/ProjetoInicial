namespace SaaSAgents.Api.Dtos;

public record MessageDto(
    int Id, string Content, string Sender,
    string Status, DateTime Timestamp
);

public record ConversationDto(
    int Id, string ContactName, string ContactPhone,
    string ContactEmail, string ContactCompany,
    string Status, string? AgentName, int UnreadCount,
    DateTime CreatedAt, DateTime UpdatedAt,
    int? LeadId, List<MessageDto> Messages
);

public record CreateConversationDto(
    string ContactName, string ContactPhone,
    string? ContactEmail, string? ContactCompany,
    string? AgentName, int? LeadId
);

public record SendMessageDto(string Content, string Sender);
