namespace SaaSAgents.Api.Models;

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public int? LeadId { get; set; }
    public Lead? Lead { get; set; }

    public int? ConversationId { get; set; }
    public Conversation? Conversation { get; set; }
}
