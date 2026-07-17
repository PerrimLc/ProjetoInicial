namespace SaaSAgents.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Role { get; set; } = "user";
    public string Phone { get; set; } = "";
    public string Company { get; set; } = "";
    public string Website { get; set; } = "";
    public string Plan { get; set; } = "Pro";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Lead> Leads { get; set; } = [];
    public ICollection<Agent> Agents { get; set; } = [];
    public ICollection<Conversation> Conversations { get; set; } = [];
    public ICollection<KnowledgeDocument> KnowledgeDocuments { get; set; } = [];
    public ICollection<TaskItem> Tasks { get; set; } = [];
    public CompanySettings? Settings { get; set; }
}
