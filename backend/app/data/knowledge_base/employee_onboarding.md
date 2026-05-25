---
title: "Employee Onboarding Guide"
category: "onboarding"
department: "People & Culture"
access_level: "internal"
---

# Employee Onboarding Guide

Welcome to the organization! This guide will help you get started on your first week.

## Day 1: Setup Essentials

### IT Account Setup
- Contact IT Help Desk at helpdesk@company.com or Slack #it-support
- You will receive your laptop with pre-configured security settings
- Enable Two-Factor Authentication (2FA) on all accounts immediately
- Set up VPN access using Cisco AnyConnect — credentials sent to personal email
- Install required tools: Slack, Zoom, 1Password, VS Code

### System Access Requests
Submit access requests via ServiceNow (service.company.com):
- GitHub Enterprise organization membership
- AWS Console (request via manager with justification)
- Datadog dashboards
- Confluence and Jira project access
- Salesforce CRM (sales/support roles only)

## Week 1 Checklist

- [ ] Complete security awareness training (mandatory, 2 hours)
- [ ] Review and sign Information Security Policy
- [ ] Meet with your team lead for 30-min onboarding call
- [ ] Join all relevant Slack channels
- [ ] Complete GDPR training module
- [ ] Set up 1:1 recurring meeting with manager
- [ ] Review team's engineering standards document

## Engineering-Specific Onboarding

### Development Environment
1. Clone the main monorepo: `git clone git@github.com:company/platform.git`
2. Install dependencies: `make setup`
3. Run local environment: `make dev`
4. Review the Architecture Decision Records (ADRs) in `/docs/adrs`

### Code Review Process
- All PRs require at least 2 approvals
- Use conventional commits: `feat:`, `fix:`, `docs:`, `chore:`
- Link Jira ticket in PR description (PLAT-XXXX format)
- CI must pass before merge

### Communication Norms
- Async-first culture — use Slack threads
- Urgent issues: use @here in #incidents
- Weekly all-hands: Tuesdays 10am PST
- Engineering sync: Thursdays 2pm PST

## Benefits & HR

### Time Off Policy
- Unlimited PTO — minimum 15 days recommended per year
- Sick leave: separate from PTO, no cap
- Public holidays: per local employment law
- Submit PTO requests in Workday at least 2 weeks ahead

### Benefits Portal
Access all benefits at benefits.company.com:
- Health, dental, vision insurance
- 401(k) with 4% employer match
- $2,000/year learning & development budget
- $500/year home office stipend
- Employee Assistance Program (EAP)

## Contact Directory

| Role | Contact |
|------|---------|
| IT Help Desk | helpdesk@company.com / #it-support |
| HR Team | hr@company.com / #people-ops |
| Security Team | security@company.com |
| Engineering Lead | engineering@company.com |
| Facilities | facilities@company.com |
