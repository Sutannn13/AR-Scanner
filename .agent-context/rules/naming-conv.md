# Naming Boundary

Use the target language and framework conventions. Do not invent a naming style from this repo.

Reject only these common LLM bad habits:
- vague names that hide meaning, such as `data`, `result`, `item`, `thing`, `temp`, `handle`, or `process` when a precise domain name exists
- names that require reading the implementation to understand the value
- mixed file or directory naming styles inside the same feature without a framework reason
- booleans, units, and side-effect functions whose names hide what they represent or change

Prefer names that explain domain intent, user action, state, and boundary responsibility.
