namespace SaaSAgents.Api.Dtos;

public record KnowledgeDocumentDto(
    int Id, string Title, string Content,
    string Category, int? AgentId, DateTime CreatedAt
);

public record CreateKnowledgeDocumentDto(
    string Title, string Content,
    string Category, int? AgentId
);

public record UpdateKnowledgeDocumentDto(
    string? Title, string? Content,
    string? Category, int? AgentId
);
