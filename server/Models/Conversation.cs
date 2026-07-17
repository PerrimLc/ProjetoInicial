namespace SaaSAgents.Api.Models;

public class Conversation
{
    public int Id { get; set; }
    public string ContactName { get; set; } = "";
    public string ContactPhone { get; set; } = "";
    public string ContactEmail { get; set; } = "";
    public string ContactCompany { get; set; } = "";
    public string Status { get; set; } = "new";   // new|active|closed
    public string? AgentName { get; set; }
    public int UnreadCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? LeadId { get; set; }
    public Lead? Lead { get; set; }

    public ICollection<Message> Messages { get; set; } = [];
    public ICollection<TaskItem> Tasks { get; set; } = [];
}
