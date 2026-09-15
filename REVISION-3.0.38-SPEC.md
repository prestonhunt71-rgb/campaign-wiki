# Revision 3.0.38 — Primary relationship breadcrumbs

Breadcrumbs always display the first saved parent relationship path, regardless of how the article was opened. Valid branch selections saved by the parent editor are honored. Older articles without saved branch selections follow parent order through the ancestors. Missing paths and cycles are handled safely.

The parent editor explains that its first path is primary. All 91 regression tests and module syntax checks pass, including four new breadcrumb regressions. Live Foundry verification remains outstanding.