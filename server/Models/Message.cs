namespace SaaSAgents.Api.Models;

public class Message
{
    public int Id { get; set; }
    public string Content { get; set; } = "";
    public string Sender { get; set; } = "user";   // user|ai|attendant
    public string Status { get; set; } = "sent";   // sent|delivered|read
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;
}
