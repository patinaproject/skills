## Priority rubric

Triage gives every triaged issue exactly one priority: the highest lane whose
condition holds. Judge only evidence in the issue: its body, comments, and
linked reports. Evidence you cannot read does not count; name it as unread.
Labels, the reporter, and effort never count. Replace this
section to change the rubric; triage reads no other.

- **Urgent:** work to triage and ship before all other open work. At least one
  trigger holds, and the triage notes name it and cite its evidence:
  1. A fault harms users now with no workaround: data loss, an outage, a
     security exposure, or a broken core flow.
  2. A legal or regulatory deadline applies.
  3. A release gate is blocked.
  4. Someone should stop work in progress for this. The notes say what would
     be interrupted and why waiting costs more.

  An issue where a trigger holds is never High.
- **High:** no Urgent trigger holds, and the issue links a customer's own
  report, or error monitoring shows broad reach.
- **Medium:** a confirmed bug or a valuable enhancement with limited reach.
- **Low:** waiting costs users nothing visible, such as maintenance-only work,
  dependency bumps, cosmetic polish, and routine follow-ups.

A confident duplicate gets no priority. Write priority to the tracker's
priority field. When the tracker has none, the triage notes' `Priority:` line
is the only record. Never encode it as a label.
