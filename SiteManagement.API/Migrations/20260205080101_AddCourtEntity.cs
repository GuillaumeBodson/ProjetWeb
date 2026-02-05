using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiteManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCourtEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlannedDays_Sites_ScheduleId",
                table: "PlannedDays");

            migrationBuilder.DropForeignKey(
                name: "FK_PlannedDays_Sites_SiteId",
                table: "PlannedDays");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_PlannedDays_ScheduleId_DayOfWeek",
                table: "PlannedDays");

            migrationBuilder.DropIndex(
                name: "IX_PlannedDays_SiteId",
                table: "PlannedDays");

            migrationBuilder.DropColumn(
                name: "ScheduleId",
                table: "PlannedDays");

            migrationBuilder.AddColumn<Guid>(
                name: "CourtId",
                table: "TimeSlots",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<Guid>(
                name: "SiteId",
                table: "PlannedDays",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SiteId1",
                table: "PlannedDays",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Courts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Number = table.Column<int>(type: "int", nullable: false),
                    SiteId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Courts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Courts_Sites_SiteId",
                        column: x => x.SiteId,
                        principalTable: "Sites",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId",
                table: "TimeSlots",
                columns: new[] { "PlannedDayId", "TimeSlotNumber", "CourtId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlannedDays_SiteId_DayOfWeek",
                table: "PlannedDays",
                columns: new[] { "SiteId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlannedDays_SiteId1",
                table: "PlannedDays",
                column: "SiteId1");

            migrationBuilder.CreateIndex(
                name: "IX_Courts_SiteId_Number",
                table: "Courts",
                columns: new[] { "SiteId", "Number" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PlannedDays_Sites_SiteId",
                table: "PlannedDays",
                column: "SiteId",
                principalTable: "Sites",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PlannedDays_Sites_SiteId1",
                table: "PlannedDays",
                column: "SiteId1",
                principalTable: "Sites",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlannedDays_Sites_SiteId",
                table: "PlannedDays");

            migrationBuilder.DropForeignKey(
                name: "FK_PlannedDays_Sites_SiteId1",
                table: "PlannedDays");

            migrationBuilder.DropTable(
                name: "Courts");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber_CourtId",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_PlannedDays_SiteId_DayOfWeek",
                table: "PlannedDays");

            migrationBuilder.DropIndex(
                name: "IX_PlannedDays_SiteId1",
                table: "PlannedDays");

            migrationBuilder.DropColumn(
                name: "CourtId",
                table: "TimeSlots");

            migrationBuilder.DropColumn(
                name: "SiteId1",
                table: "PlannedDays");

            migrationBuilder.AlterColumn<Guid>(
                name: "SiteId",
                table: "PlannedDays",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<Guid>(
                name: "ScheduleId",
                table: "PlannedDays",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_PlannedDayId_TimeSlotNumber",
                table: "TimeSlots",
                columns: new[] { "PlannedDayId", "TimeSlotNumber" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlannedDays_ScheduleId_DayOfWeek",
                table: "PlannedDays",
                columns: new[] { "ScheduleId", "DayOfWeek" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlannedDays_SiteId",
                table: "PlannedDays",
                column: "SiteId");

            migrationBuilder.AddForeignKey(
                name: "FK_PlannedDays_Sites_ScheduleId",
                table: "PlannedDays",
                column: "ScheduleId",
                principalTable: "Sites",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PlannedDays_Sites_SiteId",
                table: "PlannedDays",
                column: "SiteId",
                principalTable: "Sites",
                principalColumn: "Id");
        }
    }
}
