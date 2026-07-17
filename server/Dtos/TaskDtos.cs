namespace SaaSAgents.Api.Dtos;

public record TaskItemDto(
    int Id, string Title, string Description,
    DateTime? DueDate, bool IsCompleted,
    int? LeadId, int? ConversationId, DateTime CreatedAt
);

public record CreateTaskDto(
    string Title, string Description,
    DateTime? DueDate, int? LeadId, int? ConversationId
);

public record UpdateTaskDto(
    string? Title, string? Description,
    DateTime? DueDate, bool? IsCompleted
);
