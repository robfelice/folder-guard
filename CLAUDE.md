# Project Assistant Instructions
**Purpose:** This template provides a standardized structure for creating AI assistant project instructions, ensuring consistent governance, documentation standards, and specialized agent integration across all projects.

**Version:** 1.5
**Last Updated:** 08/10/2025

This project uses centralized governance and instruction files.

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0 | 04/07/2025 | Initial template creation |
| 1.1 | 17/07/2025 | Added specialized agent integration section and task complexity management guidelines |
| 1.2 | 17/07/2025 | Added new project creation workflow instructions |
| 1.3 | 28/07/2025 | Updated for specialized agent system, removed personality references |
| 1.5 | 08/10/2025 | Removed RAG Memory System Integration - no longer using RAG memory |

> ⚠️ **CRITICAL**: Reminder
> 
> Always verify Task 0 (Project Structure Verification) completion before proceeding with any implementation tasks

## Creating New Projects

When user says "I want to create a new project named X" with a brief/scope/idea:

1. **Bootstrap the project**:
   ```bash
   cd /mnt/f/projects
   bash governance/scripts/bootstrap_project.sh [project-name]
   ```

2. **Create PRD from brief**:
   - Ask clarifying questions to understand requirements
   - Use governance/templates/prd_template.md
   - Fill out all sections interactively
   - Save to documentation/PRD.md

3. **Complete Task 0**:
   - Review tasks/task_000_project_structure.md
   - Verify all checklist items
   - Create infrastructure_catalog.md if external dependencies exist

4. **Generate tasks from PRD**:
   - Extract discrete work units from PRD
   - Create task files using appropriate complexity templates
   - Update tasks/tasks.md with complete list

5. **Begin implementation** following task management guide

## Specialized Agent Integration

This project uses specialized governance agents for automated workflow support:
- **governance-planning-specialist**: PRD-to-task breakdown with complexity framework
- **governance-bootstrap-specialist**: Automated project initialization
- **governance-documentation-architect**: File ownership enforcement and coordination
- **governance-compliance-auditor**: Governance protocol validation
- **Claude Code CLI**: Implementation, testing, deployment

**Agent Usage Protocol**: Use specialized agents for domain-specific governance tasks
**Integration Pattern**: Agents coordinate through standard governance workflows
**Human Oversight**: Required for critical governance decisions and cross-agent coordination

## Reference Files

- Project Governance: /mnt/f/projects/governance/project_governance.md
- Standard Instructions: /mnt/f/projects/governance/INSTRUCTIONS.md
- Personality Profile: /mnt/f/projects/governance/personalities/[profile].md
- PRD Template: /mnt/f/projects/governance/templates/prd_template.md
- Task Management: /mnt/f/projects/governance/task_management_guide.md
- Reminders & Notes: /mnt/f/projects/governance/REMINDERS.md

> ⚠️ **CRITICAL**: Documentation Separation Principles
> 
> **File Ownership - NO REDUNDANCIES ALLOWED:**
> - **tasks.md** → Pure task tracking only (status, dependencies, effort estimates)
> - **current_status.md** → Progress journal only (daily logs, brief achievements, next steps)  
> - **code_index.md** → Technical file mapping only (file paths, purposes, integration patterns)
> - **CHANGELOG.md** → Version history only (user-facing changes, version numbers, dates)
> - **DEPENDENCIES.md** → Installation requirements only (packages, versions, system requirements)
> - **task_XXX.md** → Individual task details and results (performance metrics, test results belong HERE)
> 
> **NEVER duplicate information across files. Each type of information has ONE authoritative source.**

## Standard Documentation Update Command

When completing tasks, use this standard command pattern:

```
update @[project_name]/tasks/task_XXX_[name].md @[project_name]/code_index.md @[project_name]/tasks/current_status.md @[project_name]/tasks/tasks.md @[project_name]/CHANGELOG.md @[project_name]/DEPENDENCIES.md ensuring alignment with the file ownership principles in @governance/task_management_guide.md lines 340 to 364
```

**File Update Responsibilities:**
- **task_XXX.md**: Performance metrics, test results, detailed implementation notes
- **code_index.md**: File paths, integration patterns, test coverage numbers  
- **current_status.md**: Progress log entry, brief achievement summary
- **tasks.md**: Task status change, actual effort recording
- **CHANGELOG.md**: User-facing changes, version entry
- **DEPENDENCIES.md**: New dependencies (if any added)

## Task Completion Protocol

> ⚠️ **CRITICAL**: NEVER mark tasks as "Completed" without explicit human verification
- Status progression: Not Started → In Progress → Testing → **Awaiting Verification** → Completed
- When implementation is done, update status to "Awaiting Verification" and notify human
- Only change to "Completed" after human explicitly states: "Task verified, mark as complete"
- This applies to ALL tasks, subtasks, and issue resolutions

## Task Complexity Management

**MCP Server Usage**: For complex tasks, Claude Code CLI may use:
- Sequential Thinking MCP Server (complex problem decomposition)
- OpenAI MCP Server (alternative perspectives, creative solutions)
- Gemini MCP Server (large context analysis, multi-file processing)
- **Time MCP Server** (accurate timestamps for documentation updates)

**Debug Loop Prevention**: Automatic escalation protocols when implementation cycles detected


## Date/Time Management

**CRITICAL**: Always use the Time MCP Server for accurate timestamps in documentation:

```
Use mcp__time__get_current_time with timezone: "UTC" to get current date/time
Format dates as DD/MM/YYYY (e.g., 27/07/2025)
Update all documentation timestamps using actual current time
```

**When to use Time MCP**:
- Creating or updating PRDs, task files, status updates
- Adding version history entries  
- Timestamping commits and milestones
- Any documentation requiring accurate dates

## Project-Specific Guidelines

[Add any project-specific instructions, exceptions, or special requirements here]

### Agent-Specific Configuration
- **[Agent Type]**: [Specific configuration for this project]
- **[Another Agent]**: [Domain-specific guidelines]

### Task-to-Agent Mapping
- **[Task Category]**: [Primary agent responsible]
- **[Another Category]**: [Specialized agent assignment]