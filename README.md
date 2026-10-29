<p align="center"><img src="./assets/header.svg" width="100%" alt="Sai Vignesh Rayal — Cloud Security Engineer" /></p>

Five-plus years across AWS, Azure, GCP and Microsoft 365 — from operating microservices platforms to securing regulated research data and governing cloud risk. I design the boundary, automate it, and keep the evidence that it held.

**5+** years in cloud engineering and security · **3** clouds — AWS, Azure, GCP — plus Microsoft 365 · **30+** microservices operated across environments · **500+** devices managed with Intune and SCCM

**The full portfolio** — a descent through a cloud estate, one layer at a time: [saivignesh-1177.github.io/Saivignesh-1177/](https://saivignesh-1177.github.io/Saivignesh-1177/)  
<sub>Read by focus: [Cloud Security](https://saivignesh-1177.github.io/Saivignesh-1177/) · [Identity & Access](https://saivignesh-1177.github.io/Saivignesh-1177/iam/) · [Governance, Risk & Compliance](https://saivignesh-1177.github.io/Saivignesh-1177/grc/) · [DevSecOps](https://saivignesh-1177.github.io/Saivignesh-1177/devsecops/) · [Microsoft Cloud Security](https://saivignesh-1177.github.io/Saivignesh-1177/microsoft/)</sub>

<details open>
<summary><code>01 · IDENTITY</code> <b>Who may enter.</b> — <i>Access is granted narrowly, reviewed on a schedule, and never stored as a secret.</i></summary>

`Least privilege` · `Access reviews` · `RBAC` · `ABAC` · `Managed identities` · `GitHub OIDC`

- Review identity and access assignments against least privilege, document exceptions, and run periodic access reviews with system owners.  
  ↳ *Practice · 2026–present*
- Built workload identity with no reusable credential: a managed identity scoped to a single secret, with a decoy secret that proves the boundary by returning 403.  
  ↳ [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab)
- Removed stored secrets from delivery with GitHub OIDC; an ABAC condition limits the one role the pipeline may grant.  
  ↳ [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab)

</details>

<details>
<summary><code>02 · NETWORK</code> <b>Where it may go.</b> — <i>Boundaries default to deny, and configuration is held to a baseline.</i></summary>

`AWS` · `Azure` · `GCP` · `VPC` · `EC2` · `EKS` · `S3` · `RDS` · `Azure networking` · `Hardening baselines`

- Review compute, network and storage configuration against security baselines and carry each misconfiguration through remediation with its infrastructure owner.  
  ↳ *Practice · 2026–present*
- Designed, deployed and hardened Azure infrastructure — virtual machines, networking and storage — while reducing cost by 15%.  
  ↳ *Practice · 2023–25*
- Designed AWS architectures across EC2, EKS, VPC, S3 and RDS.  
  ↳ *Practice · 2020–22*
- Built a sealed AWS range with no internet or NAT path, no public addresses and a quarantine subnet, gated by guardrail tests before any workload exists.  
  ↳ `living-museum-of-cyber-warfare` *(release pending)*

</details>

<details>
<summary><code>03 · WORKLOAD</code> <b>What it may run.</b> — <i>Platforms are built as code and delivered by pipelines that are themselves controls.</i></summary>

`Terraform` · `Ansible` · `PowerShell` · `JSON templates` · `Docker` · `Kubernetes` · `OpenShift` · `Jenkins`

- Led a six-engineer team operating 30+ microservices through deployment, migration, maintenance and troubleshooting.  
  ↳ *Practice · 2020–22*
- Migrated microservices from Linux hosts to OpenShift, and from OpenShift to AWS.  
  ↳ *Practice · 2020–22*
- Automated infrastructure with Terraform and PowerShell, cutting manual effort by 40%.  
  ↳ *Practice · 2020–22*
- Automated Azure deployment with PowerShell and JSON templates, cutting manual effort by 30%.  
  ↳ *Practice · 2023–25*
- Made the pipeline block on security: Bicep lint with security rules as errors, Checkov, Gitleaks across full history, and traceability tests.  
  ↳ [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab)

</details>

<details>
<summary><code>04 · DATA</code> <b>What it may read.</b> — <i>Sensitive data stays classified and contained, on devices that are patched and compliant.</i></summary>

`Microsoft Defender` · `Data loss prevention` · `Security & Compliance Center` · `Microsoft 365` · `Intune` · `SCCM`

- Designed security for regulated research data, improving secure workload onboarding by 30%.  
  ↳ *Practice · 2025–26*
- Configured data loss prevention and threat-management policy in the Microsoft Security & Compliance Center.  
  ↳ *Practice · 2023–25*
- Administered Microsoft 365 — Exchange Online, SharePoint Online, OneDrive, Teams and Defender — improving platform reliability by 20%.  
  ↳ *Practice · 2023–25*
- Ran SCCM and Intune across 500+ devices: deployment, patching, compliance enforcement and device policy.  
  ↳ *Practice · 2020–22*

</details>

<details>
<summary><code>05 · DETECTION</code> <b>What we will see.</b> — <i>Find the weakness before an attacker does; see the attempt when one comes.</i></summary>

`Vulnerability assessment` · `Risk analysis` · `Threat modelling` · `KQL` · `Dynatrace` · `Datadog` · `Grafana` · `Nagios`

- Reduced high-risk misconfiguration exposure by 25% through vulnerability testing, risk analysis and security assessment of cloud infrastructure.  
  ↳ *Practice · 2025–26*
- Assess vulnerability and configuration findings for risk and business impact, and track corrective action through validation and closure.  
  ↳ *Practice · 2026–present*
- Monitored cloud environments for threats and supported incident response, improving response turnaround by 20%.  
  ↳ *Practice · 2025–26*
- Hardened cloud infrastructure and responded to security incidents alongside IT security.  
  ↳ *Practice · 2023–25*
- Threat-modelled with STRIDE and ran eight adversary-emulation scenarios; each finding was fixed and re-tested or formally risk-accepted.  
  ↳ [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab)

</details>

<details>
<summary><code>06 · EVIDENCE</code> <b>Proof that it held.</b> — <i>Controls are mapped to requirements, tested, and recoverable — with evidence an assessor can trace.</i></summary>

`NIST-based controls` · `HIPAA-aligned practice` · `Control mapping` · `Audit evidence` · `Business continuity` · `Disaster recovery` · `Change management`

- Map cloud controls to policy and compliance requirements, identify gaps, and maintain risk records and audit evidence through remediation.  
  ↳ *Practice · 2026–present*
- Defined security requirements and control mappings, increasing documented control coverage by 35%.  
  ↳ *Practice · 2025–26*
- Wrote security standards, runbooks and continuity and recovery procedures, improving audit readiness and resilience by 30%.  
  ↳ *Practice · 2025–26*
- Integrated cloud services across IT, development, research and infrastructure teams, reducing security-review delays by 25%.  
  ↳ *Practice · 2025–26*
- Delivered backup and disaster recovery for Azure resources and SQL databases, holding 99.9% data availability.  
  ↳ *Practice · 2023–25*
- Traced 29 NIST SP 800-53 controls from implementation to test, evidence and threat, with tests that fail the build when a threat loses its control.  
  ↳ [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab)

</details>

<p align="center"><img src="./assets/ledger.svg" width="100%" alt="Outcome figures as reported in professional practice" /></p>

## Experience

| Period | Role | Scope |
|---|---|---|
| Jun 2026 – Present | **Cloud Security & GRC Analyst** | Configuration and access review, risk assessment, control mapping and audit evidence. |
| Apr 2025 – Apr 2026 | **Cybersecurity Engineer II · Cloud Security Engineer** | Security architecture, assessment and response for regulated research data. |
| Apr 2023 – Mar 2025 | **Cloud Engineer** | Azure and Microsoft 365 infrastructure, automation, recovery and data protection. |
| Feb 2020 – Jun 2022 | **Microsoft Cloud Solution Engineer** | Microservices platforms, cloud migration, infrastructure as code and endpoint management. |

## Leadership

- Led a six-engineer team responsible for 30+ microservices.
- Mentored engineers on Azure, Microsoft 365 and automation.
- Led client engagement, risk mitigation and delivery, sustaining 95% client satisfaction.

## Evidence

| Repository | Statements citing it |
|---|---|
| [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab) | 5 |
| `living-museum-of-cyber-warfare` *(release pending)* | 1 |

**Open items** — stated plainly.

| ID | Item | Where |
|---|---|---|
| `EVD-008` | Azure Policy and Defender CSPM report captured as evidence | [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab) |
| `EVD-010` | GitHub OIDC deployment run recorded | [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab) |
| `EVD-011` | MFA enforcement evidence captured | [`azure-iam-zero-trust-lab`](https://github.com/Saivignesh-1177/azure-iam-zero-trust-lab) |
| `LM-SEN` | Sensor layer: Zeek and Suricata with VPC traffic mirroring | `living-museum-of-cyber-warfare` *(release pending)* |
| `LM-STATE` | Terraform state moved to a private, locked S3 backend | `living-museum-of-cyber-warfare` *(release pending)* |

## Education

**Master of Artificial Intelligence — University of North Texas** — Cloud Computing · Networking · Computer Algorithms · Software Development with AI

## Contact

[rollasaivigneshrayal@gmail.com](mailto:rollasaivigneshrayal@gmail.com) · United States · open to relocation

---

<sub>Every statement cites its source: a period of professional practice or a public repository. Outcome figures are as reported in professional practice, not live telemetry. Generated from <code>profile.json</code> — the same source as the site and the artwork. Typefaces: Instrument Serif and IBM Plex (SIL Open Font License), self-hosted. No trackers or third-party requests.</sub>
