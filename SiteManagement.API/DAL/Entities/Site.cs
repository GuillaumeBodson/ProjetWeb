namespace SiteManagement.API.DAL.Entities;

public class Site
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public HashSet<DateOnly> ClosedDays { get; set; } = [];

    // Navigation properties
    public ICollection<Court> Courts { get; set; } = [];
    public ICollection<PlannedDay> PlannedDays { get; set; } = [];
}
