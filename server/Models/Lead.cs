namespace SaaSAgents.Api.Models;

public class Lead
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Company { get; set; } = "";
    public string Source { get; set; } = "";
    public string Status { get; set; } = "new";          // new|qualified|proposal|negotiation|closed|lost
    public string PipelineStage { get; set; } = "new";   // kanban column id
    public decimal EstimatedValue { get; set; }
    public string Responsible { get; set; } = "";
    public string Notes { get; set; } = "";
    public int Score { get; set; } = 50;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public ICollection<Conversation> Conversations { get; set; } = [];
    public ICollection<TaskItem> Tasks { get; set; } = [];
}
