# RapportVerse × Ascend ATS Bridge Integration Guide
> Technical Specification & Implementation Guide for Completing the Ecosystem Bridge
> **Version:** 1.0.0 | **Author:** Ascend ATS Architecture Team & Chris Barnes | **Target:** RapportVerse (`https://rapprt.space`)

---

## 1. Executive Summary & Partnership Architecture

This document specifies the technical contract and synchronization protocols required for **RapportVerse** to complete the bidirectional bridge with **Ascend ATS**.

```
┌─────────────────────────────────────────────────────────┐       ┌────────────────────────────────────────────────────────┐
│                      Ascend ATS                         │       │                      RapportVerse                      │
│                (https://ascendats.com)                  │       │                 (https://rapprt.space)                 │
├─────────────────────────────────────────────────────────┤       ├────────────────────────────────────────────────────────┤
│ • Master Candidate Profile (Skills, Experience, Goals)  │       │ • Concentric Dunbar Trust Orbits (5, 15, 50, 150)       │
│ • Deterministic Matching Engine & Wage Fit              │◄─────►│ • David Maister Trust Equation Analysis (C+R+I)/S      │
│ • Sliding Privacy Cloak (GDPR Client-Side Redaction)    │       │ • Neurodiversity-Affirming Relationship Intelligence   │
│ • Requisition Audit Trails & Verified Referees          │       │ • Sensory-Calm Communication & Object Permanence Radar │
└─────────────────────────────────────────────────────────┘       └────────────────────────────────────────────────────────┘
```

---

## 2. Integration Pathways

The bridge supports two complementary modes of integration:
1. **Lightweight Deep-Linking & Iframe/Canvas Embeds** (Immediate, zero-backend setup)
2. **Direct JSON Ingestion & Webhook Handshake** (High-fidelity topology synchronization)

---

## 3. Data Contract Specification

### A. Egress Payload from Ascend ATS to RapportVerse

When an Ascend ATS user triggers **"Export to RapportVerse"** or syncs their verified reference graph, Ascend emits the following canonical schema (`rapportverse-trust-topology.json`):

```typescript
export interface AscendToRapportVersePayload {
  version: "1.2.0";
  sourcePlatform: "Ascend ATS";
  exportedAt: string; // ISO 8601 UTC
  candidateCloakLevel: 1 | 2 | 3 | 4; // 1: Unrestricted, 4: Maximum PII Cloak
  candidateRefId: string; // Pseudonymized UUID token
  trustNodes: Array<{
    nodeId: string;
    displayName: string;
    professionalRole: string;
    organization: string;
    dunbarTier: "dunbar_5" | "dunbar_15" | "dunbar_50" | "dunbar_150";
    relationshipType: "mentor" | "executive_sponsor" | "peer_collaborator" | "verified_referee" | "hiring_lead";
    maisterVector: {
      credibility: number;     // 1.0 - 10.0 (Verifiable competence)
      reliability: number;     // 1.0 - 10.0 (Follow-through & consistency)
      intimacy: number;        // 1.0 - 10.0 (Psychological safety & candor)
      selfOrientation: number; // 0.5 - 10.0 (Ego / Transactional focus — Lower is higher trust)
      trustQuotient: number;   // Computed: (C + R + I) / S
    };
    neurodiversityAffinity: {
      communicationStyle: "direct_async" | "structured_agenda" | "visual_first" | "sensory_calm";
      accommodationsActive: boolean;
      notes?: string;
    };
    verifiedSkillTags: string[];
  }>;
  neurodiversityPreferences: {
    sensoryCalmModeDefault: boolean;
    transparentCompensationRequired: boolean;
    interviewRubricsPreferred: boolean;
  };
}
```

---

### B. Ingress Webhook Endpoint on RapportVerse (`https://rapprt.space/api/bridge`)

To accept real-time synchronization from Ascend ATS, implement a `POST` handler on the RapportVerse server:

#### **Request Headers:**
```http
POST /api/bridge HTTP/1.1
Host: rapprt.space
Content-Type: application/json
X-Ascend-Origin: https://ascendats.com
X-Ascend-Signature: sha256_hmac_signature
```

#### **Success Response (HTTP 200 OK):**
```json
{
  "status": "success",
  "syncedNodesCount": 5,
  "rapportVerseTopologyId": "rv_topo_8f912a7e",
  "redirectUrl": "https://rapprt.space/orbit?topologyId=rv_topo_8f912a7e",
  "message": "Topology mapped successfully to Dunbar rings with Maister alignment active."
}
```

---

## 4. Deep-Link URL Protocol

RapportVerse can link users directly into specific Ascend ATS views, and Ascend ATS will link directly into RapportVerse orbits.

### Ascend ATS → RapportVerse URL Syntax:
```
https://rapprt.space/import?partner=ascend_ats&refId=<CANDIDATE_TOKEN>&dunbarCount=<NODE_COUNT>&theme=dark
```

### RapportVerse → Ascend ATS URL Syntax:
```
https://ascendats.com/#rapportverse?partnerId=rapportverse&focusNode=<NODE_ID>&trustQuotient=<TQ_SCORE>
```

When opened, Ascend ATS automatically focuses on the specified node in the interactive **Concentric Trust Radar** and populates the **David Maister Trust Simulator**.

---

## 5. UI/UX Components for RapportVerse

To surface the Ascend ATS integration within the RapportVerse interface:

### 1. Verified Ascend ATS Badges
Embed this markdown or SVG badge in your network exporter and partner directory:

```markdown
[![Verified Partner: Ascend ATS](https://img.shields.io/badge/Partner-Ascend%20ATS-2563eb?style=for-the-badge&logo=shield&logoColor=fff&labelColor=0f172a)](https://ascendats.com/#rapportverse)
```

### 2. "Import from Ascend ATS" Button
Place an action trigger in your Orbit / Dunbar canvas toolbar:
```tsx
<button
  onClick={() => window.open('https://ascendats.com/#rapportverse', '_blank')}
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
>
  <img src="https://ascendats.com/favicon.svg" className="w-4 h-4" alt="Ascend ATS" />
  <span>Connect Ascend Master Profile</span>
</button>
```

---

## 6. Security, Consent & GDPR Compliance

1. **Client-Side Sovereignty:** All PII cloaking (Level 1–4) is executed on the client before payload export. If a candidate enables *Level 4 Maximum Cloak*, names and employer identities are replaced with cryptographic tokens.
2. **Zero Secondary Telemetry:** Payloads contain zero tracking pixels or third-party ad beacon dependencies.
3. **Double Empathy Standard:** Both platforms guarantee that neurodiversity accommodations and communication preferences are treated as affirmative strengths, not clinical disclosures.

---

## 7. Implementation Checklist for RapportVerse Developers

- [ ] **Step 1:** Add the `POST /api/bridge` endpoint (or file drop parser for `.json` topologies) matching the `AscendToRapportVersePayload` schema.
- [ ] **Step 2:** Map `dunbarTier` values (`dunbar_5`, `dunbar_15`, `dunbar_50`, `dunbar_150`) into RapportVerse's concentric canvas rings.
- [ ] **Step 3:** Ingest the `maisterVector` attributes to automatically set node color gradients and orbit gravity.
- [ ] **Step 4:** Place the **"Ascend ATS Strategic Partner"** badge in your footer/affiliate showcases.
- [ ] **Step 5:** Test end-to-end sync using the sandbox simulator at `/#rapportverse` in Ascend ATS.

---

## 8. Contacts & Direct Channel

- **Ascend ATS Platform Lead:** Chris Barnes (`Chris.Barnes.2000@me.com`)
- **Ascend ATS Partner Portal:** [https://ascendats.com/#rapportverse](https://ascendats.com/#rapportverse)
- **RapportVerse Partner Hub:** [https://rapprt.space](https://rapprt.space)
