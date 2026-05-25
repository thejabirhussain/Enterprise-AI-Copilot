---
title: "Information Security Policy"
category: "security"
department: "Security"
access_level: "internal"
---

# Enterprise Information Security Policy

**Version:** 3.2 | **Effective Date:** 2024-01-01 | **Next Review:** 2025-01-01

## 1. Purpose and Scope

This policy establishes the security standards for all employees, contractors, and third-party vendors who access company systems, networks, and data. Compliance is mandatory.

## 2. Data Classification

### Classification Levels

| Level | Definition | Examples |
|-------|-----------|---------|
| **Public** | Approved for external sharing | Marketing materials, press releases |
| **Internal** | For employee use only | Policies, procedures, internal docs |
| **Confidential** | Sensitive business data | Customer PII, financial data, IP |
| **Restricted** | Highest protection required | Encryption keys, passwords, source code |

## 3. Access Control

### Principle of Least Privilege
- Users receive only the minimum access required for their role
- Access reviews conducted quarterly by security team
- Privileged access (admin/root) requires manager + security approval
- All privileged sessions logged in CyberArk PAM

### Multi-Factor Authentication (MFA)
MFA is **mandatory** for:
- All cloud accounts (AWS, GCP, Azure)
- VPN access
- Production system access
- Password managers

Acceptable MFA methods:
1. Hardware security key (YubiKey) — **preferred**
2. Authenticator app (Google Authenticator, Authy)
3. SMS — allowed only as backup (not primary)

## 4. Password Policy

- Minimum 14 characters
- Must use a password manager (1Password provided)
- No password reuse for 12 previous passwords
- Automatic expiry: 90 days for privileged accounts, 365 days for standard
- Immediate rotation required upon suspected compromise

## 5. Acceptable Use Policy

### Permitted Use
- Business-related work activities
- Incidental personal use that doesn't affect performance or security

### Prohibited Activities
- Installing unauthorized software on company devices
- Accessing systems outside of approved role
- Sharing credentials with colleagues
- Using company resources for cryptocurrency mining
- Accessing inappropriate content on company networks
- Exfiltrating company data to personal storage (USB, personal cloud)

## 6. Incident Response

### Reporting Security Incidents
Report immediately to: security@company.com or #security-incidents Slack

**Severity Classification:**
- **P0 Critical**: Active breach, ransomware, data exfiltration — call Security Hotline
- **P1 High**: Phishing success, account compromise — respond within 1 hour
- **P2 Medium**: Policy violation, suspicious activity — respond within 4 hours
- **P3 Low**: Lost device, minor policy breach — respond within 24 hours

### Incident Response Steps
1. **Contain**: Isolate affected systems immediately
2. **Assess**: Determine scope and impact
3. **Notify**: Alert security team and leadership
4. **Eradicate**: Remove threat from environment
5. **Recover**: Restore systems from clean backups
6. **Review**: Post-incident review within 72 hours

## 7. Remote Work Security

- Always use company VPN on public/home networks
- Lock screen when leaving workstation (Win+L / Cmd+Ctrl+Q)
- Do not allow family members to use company devices
- Home office network: use WPA3 encryption, unique strong password
- Video calls: blur background when in public spaces

## 8. Cloud Security

### AWS Security Standards
- All S3 buckets must have public access blocked by default
- Encryption at rest required for all data stores (KMS)
- CloudTrail logging enabled in all regions
- Security Hub findings reviewed weekly
- No root account usage — use IAM with MFA

### Third-Party Integrations
- All new SaaS tools require security review before procurement
- Submit security review request via security@company.com
- Review includes: SOC 2 Type II, data processing agreements, SSO support

## 9. Device Security

- Full disk encryption required (FileVault on Mac, BitLocker on Windows)
- Automatic screen lock: 5 minutes idle
- OS updates applied within 14 days of release
- Endpoint Detection & Response (EDR): CrowdStrike Falcon installed on all devices
- Lost/stolen devices: report immediately, remote wipe initiated within 1 hour

## 10. Consequences

Violations of this policy may result in:
- Mandatory security training
- Written warning
- Suspension of system access
- Termination of employment
- Legal action for intentional violations
