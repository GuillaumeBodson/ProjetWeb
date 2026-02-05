using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiteManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTimeSlotWithBookStateAndWeekNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "IsBooked",
                table: "TimeSlots");

            migrationBuilder.AddColumn<string>(
                name: "BookState",
                table: "TimeSlots",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "WeekNumber",
                table: "TimeSlots",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId_WeekNumber",
                table: "TimeSlots",
                columns: new[] { "PlannedDayId", "TimeSlotNumber", "CourtId", "WeekNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId_WeekNumber",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "BookState",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "WeekNumber",
                table: "TimeSlots");

            migrationBuilder.AddColumn<bool>(
                name: "IsBooked",
                table: "TimeSlots",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId",
                table: "TimeSlots",
                columns: new[] { "PlannedDayId", "TimeSlotNumber", "CourtId" },
                unique: true);
        }
    }
}
