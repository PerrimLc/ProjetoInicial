namespace SaaSAgents.Api.Dtos;

public record LeadDto(
    int Id, string Name, string Email, string Phone,
    string Company, string Source, string Status, string PipelineStage,
    decimal EstimatedValue, string Responsible, string Notes,
    int Score, DateTime CreatedAt
);

public record CreateLeadDto(
    string Name, string Email, string Phone,
    string Company, string Source, string Status,
    string PipelineStage, decimal EstimatedValue,
    string Responsible, string Notes
);

public record UpdateLeadDto(
    string? Name, string? Email, string? Phone,
    string? Company, string? Source, string? Status,
    string? PipelineStage, decimal? EstimatedValue,
    string? Responsible, string? Notes
);
