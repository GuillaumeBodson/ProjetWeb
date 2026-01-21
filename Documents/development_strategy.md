# Code and Git Strategy

## Overview
This document outlines the development standards and practices for the Paddle Sites Management web application. Following these guidelines ensures code quality, maintainability, and effective collaboration. 

## Global development strategy

### Big picture

From the client needs, evaluate the big features and pages that has to be developed. The development will be organized page by page. So development order should be established. The next 2 pages should be deepen annalysed.

### Analyse

Once the order has been set, a more exhaustive analyse has to be made. 
For each pages, a new md file should be created with the name of the page. In this file, there must be a table containing user stories. The user stories should follow this format: 
| role        | condition             | action               | benefit                      |
|-------------|-----------------------|----------------------|------------------------------|
| As a [role] | (potential condition) | I can [do something] | So that I [get some benefit] |

### Frontend-First Development
The initial development phase will focus on **Angular frontend development** to: 
- Visualize and validate user workflows
- Define and prioritize features based on UI requirements
- Identify the underlying data structures needed
- Establish data formats and interfaces early
- Create a foundation for backend API specifications

This approach ensures that: 
1. UI/UX can be tested and refined early
2. Data requirements are clearly defined before backend development
3. API contracts are established through TypeScript interfaces
4. Backend development can follow TDD with clear requirements


### Resposiveness

To ensure responsivness and optimal performances on smaller screens, adopt the mobile first approach:
Develop a feature for mobile size device and then adapt the display for larger screens.

## Code Quality Standards

### SOLID Principles
All code must adhere to SOLID principles to ensure maintainability and scalability: 

- **Single Responsibility Principle (SRP)**: Each class/module should have one reason to change
- **Open/Closed Principle (OCP)**: Open for extension, closed for modification
- **Liskov Substitution Principle (LSP)**: Derived classes must be substitutable for their base classes
- **Interface Segregation Principle (ISP)**: Clients should not depend on interfaces they don't use
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions

### Architecture Best Practices

#### Avoid Tight Coupling
- Use dependency injection to manage dependencies
- Implement clear interfaces between components
- Keep business logic separate from infrastructure concerns
- Use design patterns appropriately (Repository, Factory, Strategy, etc.)

#### Well-Structured Code
- Follow a layered architecture approach: 
  - **Presentation Layer**: UI components, controllers
  - **Business Logic Layer**: Core application logic, services
  - **Data Access Layer**: Repositories, data models
  - **Infrastructure Layer**: External services, frameworks
- Maintain clear separation of concerns
- Keep functions and methods focused and concise
- Use meaningful names for variables, functions, and classes

### Clean Code Practices
- Write self-documenting code with clear, descriptive names
- Keep functions small and focused (ideally under 20 lines)
- Avoid code duplication (DRY - Don't Repeat Yourself)
- Use consistent formatting and style conventions
- Comment only when necessary to explain "why", not "what"
- Refactor regularly to improve code quality

## Test Driven Development (TDD)

### Backend Development
All backend development **must** follow Test Driven Development:

1. **Write the test first** - Define expected behavior before implementation
2. **Run the test** - Verify it fails (Red phase)
3. **Write minimal code** - Implement just enough to pass the test (Green phase)
4. **Refactor** - Improve code while keeping tests green (Refactor phase)

### Testing Guidelines
- Aim for high test coverage (minimum 80% for backend)
- Write unit tests for business logic
- Create integration tests for API endpoints
- Use descriptive test names that explain the scenario
- Follow the AAA pattern: Arrange, Act, Assert
- Keep tests independent and isolated

### Test Structure
```
tests/
├── unit/
│   ├── services/
│   ├── repositories/
│   └── models/
└── integration/
    └── api/
```

## Git Strategy

### Branch Protection
- **Main branch is protected** - No direct commits allowed
- All changes must go through Pull Requests
- Require at least one approval before merging
- Require status checks to pass before merging

### Branching Model

#### Branch Naming Convention
Follow this format for all branches:
```
<issue-number>-<short-description>
```

**Examples:**
- `123-add-paddle-court-booking`
- `456-fix-user-authentication`
- `789-improve-repository-pattern`

#### Workflow

1. **Create an Issue**
   - Document the task, bug, or feature
   - Add appropriate labels and assignees
   - Link to project milestones if applicable

2. **Create a Branch**
   - Branch from `main`
   - Link the branch to the issue
   - Use the naming convention above

3. **Develop with TDD** (for backend)
   - Write tests first
   - Implement features
   - Ensure all tests pass

4. **Commit Regularly**
   - Make small, focused commits
   - Write clear, descriptive commit messages


5. **Use Conventional Commits**
   ```
   (<scope>): <subject>
   
   <body>
   ```
   
   **Types:** feat, fix, docs, style, refactor, test, chore
   
   **Example:**
   ```
   feat(booking): add court availability check
   
   Implements the logic to verify court availability
   before confirming a booking.
   ```

6. **Create Pull Request**
   - Provide a clear description of changes
   - Reference the related issue(s)
   - Add appropriate labels
   - Request review from team members

7. **Use GitHub Copilot for PR Review**
   - Leverage Copilot to review code quality
   - Check for potential issues and improvements
   - Ensure code follows project standards

8. **Code Review**
   - Address all review comments
   - Make requested changes
   - Re-request review when ready

9. **Merge**
   - Use "Squash and merge" for clean history
   - Delete the branch after merging
   - Close the related issue if not auto-closed


## AI-Assisted Development

### GitHub Copilot Usage
The use of GitHub Copilot is **strongly recommended** to: 

#### Accelerate Development
- Generate boilerplate code and repetitive patterns
- Suggest implementations based on function names and comments
- Auto-complete code with context awareness
- Generate test cases and test data

#### Improve Code Quality
- Get inline suggestions for better implementations
- Receive recommendations for design patterns
- Identify potential bugs and issues
- Generate comprehensive documentation

#### Best Practices with Copilot
- Review all AI-generated code carefully
- Ensure suggestions align with project standards
- Use Copilot as a tool, not a replacement for thinking
- Verify that generated code follows SOLID principles
- Test all AI-generated code thoroughly
- Use Copilot for PR reviews to catch issues early

### Copilot Features to Leverage
- **Code completion**: For faster implementation
- **Test generation**: To support TDD workflow
- **Code explanation**: To understand complex code
- **PR reviews**: To ensure quality before merging
- **Documentation**: To generate and maintain docs
- **Refactoring suggestions**: To improve code structure

## Code Review Checklist

Before approving a Pull Request, verify: 

- [ ] Code follows SOLID principles
- [ ] Architecture is well-structured with loose coupling
- [ ] Backend changes include tests (TDD followed)
- [ ] All tests pass
- [ ] Code is clean and readable
- [ ] No unnecessary dependencies added
- [ ] Documentation is updated if needed
- [ ] Commit messages are clear and follow conventions
- [ ] No merge conflicts with main branch
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed

## Documentation Standards

- Keep README.md updated with setup instructions
- Document API endpoints and their usage
- Maintain architecture diagrams when structure changes
- Add inline documentation for complex logic
- Update this strategy document as practices evolve

