namespace SaaSAgents.Api.Models;

public class Agent
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public string Goal { get; set; } = "";
    public string Tone { get; set; } = "professional";
    public string BasePrompt { get; set; } = "";
    public string Model { get; set; } = "GPT-4o";
    public double Temperature { get; set; } = 0.7;
    public bool IsActive { get; set; } = true;
    public string Color { get; set; } = "#8B5CF6";
    public int ConversationCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<KnowledgeDocument> KnowledgeDocuments { get; set; } = [];
}
