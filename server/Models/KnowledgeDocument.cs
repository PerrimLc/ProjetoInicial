namespace SaaSAgents.Api.Models;

public class KnowledgeDocument
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Content { get; set; } = "";
    public string Category { get; set; } = "Geral";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? AgentId { get; set; }
    public Agent? Agent { get; set; }
}
