using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SiteManagement.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNavigationProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_TimeSlots_CourtId",
                table: "TimeSlots",
                column: "CourtId");

            migrationBuilder.AddForeignKey(
                name: "FK_TimeSlots_Courts_CourtId",
                table: "TimeSlots",
                column: "CourtId",
                principalTable: "Courts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TimeSlots_Courts_CourtId",
                table: "TimeSlots");

            migrationBuilder.DropIndex(
                name: "IX_TimeSlots_CourtId",
                table: "TimeSlots");
        }
    }
}
