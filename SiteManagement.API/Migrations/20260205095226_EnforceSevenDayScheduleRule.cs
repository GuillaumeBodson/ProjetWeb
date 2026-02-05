using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiteManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class EnforceSevenDayScheduleRule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PlannedDays_Sites_SiteId1",
                table: "PlannedDays");

            migrationBuilder.DropIndex(
                name: "IX_PlannedDays_SiteId1",
                table: "PlannedDays");

            migrationBuilder.DropColumn(
                name: "SiteId1",
                table: "PlannedDays");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SiteId1",
                table: "PlannedDays",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlannedDays_SiteId1",
                table: "PlannedDays",
                column: "SiteId1");

            migrationBuilder.AddForeignKey(
                name: "FK_PlannedDays_Sites_SiteId1",
                table: "PlannedDays",
                column: "SiteId1",
                principalTable: "Sites",
                principalColumn: "Id");
        }
    }
}
