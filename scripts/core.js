export const SCHEMA_VERSION = 2;

export const ENTITY_TYPES = Object.freeze(["actor", "scene", "image", "area", "affiliation", "arc", "session"]);
export const VISIBILITY = Object.freeze({ AUTOMATIC: "automatic", PUBLIC: "always-public", GM: "always-gm" });
export const ATTENTION = Object.freeze({
  INCOMPLETE_ACTOR: "incomplete-actor", INCOMPLETE_SCENE: "incomplete-scene", INCOMPLETE_IMAGE: "incomplete-image",
  INCOMPLETE_AREA: "incomplete-area", INCOMPLETE_AFFILIATION: "incomplete-affiliation", MISSING_SOURCE: "missing-foundry-source",
  MISSING_SESSION_ART: "missing-session-art", MISSING_SYNOPSIS: "missing-synopsis", MISSING_ARC_ART: "missing-arc-art",
  AMBIGUOUS_LINK: "ambiguous-synopsis-link", PREVIOUS_APPEARANCE: "possible-previous-appearance", POSSIBLE_MATCH: "possible-match",
  MIGRATION: "migration-remediation", DNPC: "ambiguous-dnpc-owner"
});

const clone = value => globalThis.structuredClone ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const text = value => String(value ?? "").trim();
const list = value => [...new Set((Array.isArray(value) ? value : []).filter(Boolean))];
export const makeId = (prefix = "wiki") => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
export const dateString = value => /^\d{4}-\d{2}-\d{2}$/.test(text(value)) ? text(value) : "";

export function emptyDatabase(worldId = "") {
  return { schemaVersion: SCHEMA_VERSION, worldId: text(worldId), createdAt: new Date().toISOString(), entities: {}, resolutions: {}, migration: null };
}

export function normalizeEntity(input, now = new Date().toISOString()) {
  const entity = clone(input ?? {});
  if (!ENTITY_TYPES.includes(entity.type)) throw new Error(`Unsupported Campaign Wiki type: ${entity.type}`);
  entity.id = text(entity.id) || makeId(entity.type);
  entity.name = text(entity.name);
  entity.aliases = list(entity.aliases).map(text).filter(Boolean).filter(alias => alias.toLocaleLowerCase() !== entity.name.toLocaleLowerCase());
  entity.description = String(entity.description ?? "");
  entity.art = text(entity.art);
  entity.visibility = Object.values(VISIBILITY).includes(entity.visibility) ? entity.visibility : VISIBILITY.AUTOMATIC;
  entity.affiliationIds = list(entity.affiliationIds);
  entity.createdAt = entity.createdAt || now;
  entity.updatedAt = now;
  if (["actor", "scene"].includes(entity.type)) entity.source = entity.source ? { uuid: text(entity.source.uuid), id: text(entity.source.id), missing: Boolean(entity.source.missing) } : null;
  if (entity.type === "actor") {
    entity.classification = ["hero", "villain", "npc"].includes(entity.classification) ? entity.classification : "npc";
    entity.portrait = text(entity.portrait || entity.art); entity.tokenArt = text(entity.tokenArt); entity.quote = String(entity.quote ?? "");
    entity.dnpcOwnerId = text(entity.dnpcOwnerId) || null;
  }
  if (entity.type === "scene") entity.areaId = text(entity.areaId) || null;
  if (entity.type === "image") entity.classification = ["vehicle", "equipment", "macguffin", "media", "other"].includes(entity.classification) ? entity.classification : "other";
  if (entity.type === "area") { entity.areaType = ["city", "district"].includes(entity.areaType) ? entity.areaType : null; entity.parentAreaId = text(entity.parentAreaId) || null; entity.sceneSource = entity.sceneSource ?? null; }
  if (entity.type === "arc") { entity.arcType = entity.arcType === "metaplot" ? "metaplot" : "arc"; entity.status = entity.status === "complete" ? "complete" : "in-progress"; entity.metaplotId = entity.arcType === "arc" ? text(entity.metaplotId) || null : null; entity.keepPublished = Boolean(entity.keepPublished); }
  if (entity.type === "session") { entity.arcId = text(entity.arcId); entity.playDate = dateString(entity.playDate); entity.synopsis = String(entity.synopsis ?? ""); entity.memberIds = list(entity.memberIds); entity.synopsisDecisions = entity.synopsisDecisions ?? {}; }
  return entity;
}

export function putEntity(database, input, { preserveRename = true } = {}) {
  const previous = input?.id ? database.entities[input.id] : null;
  const next = normalizeEntity({ ...previous, ...input, aliases: input.aliases ?? previous?.aliases ?? [] });
  if (!next.name) throw new Error("Name is required.");
  if (next.type === "session" && (!next.arcId || !next.playDate)) throw new Error("A Session requires an Arc and Play Date.");
  if (preserveRename && previous?.name && previous.name !== next.name) next.aliases = list([...next.aliases, previous.name]);
  database.entities[next.id] = next;
  return next;
}

export function removeEntity(database, id) {
  const target = database.entities[id];
  if (!target) return [];
  const removed = [id];
  if (target.type === "arc" && target.arcType === "arc") {
    for (const entity of Object.values(database.entities)) if (entity.type === "session" && entity.arcId === id) { delete database.entities[entity.id]; removed.push(entity.id); }
  }
  if (target.type === "arc" && target.arcType === "metaplot") for (const arc of Object.values(database.entities)) if (arc.type === "arc" && arc.metaplotId === id) arc.metaplotId = null;
  delete database.entities[id];
  for (const entity of Object.values(database.entities)) {
    entity.affiliationIds = entity.affiliationIds?.filter(value => value !== id) ?? [];
    if (entity.type === "session") entity.memberIds = entity.memberIds.filter(value => value !== id);
    if (entity.type === "scene" && entity.areaId === id) entity.areaId = null;
    if (entity.type === "area" && entity.parentAreaId === id) entity.parentAreaId = null;
    if (entity.type === "actor" && entity.dnpcOwnerId === id) entity.dnpcOwnerId = null;
  }
  return removed;
}

export const entitiesOf = (database, type) => Object.values(database.entities).filter(entity => entity.type === type);
export const sessionArc = (database, session) => database.entities[session.arcId]?.type === "arc" ? database.entities[session.arcId] : null;
export const arcSessions = (database, arcId) => entitiesOf(database, "session").filter(session => session.arcId === arcId).sort((a, b) => b.playDate.localeCompare(a.playDate) || b.createdAt.localeCompare(a.createdAt));
export const metaplotArcs = (database, metaplotId) => entitiesOf(database, "arc").filter(arc => arc.arcType === "arc" && arc.metaplotId === metaplotId).sort((a, b) => (arcDates(database, b)?.end ?? "").localeCompare(arcDates(database, a)?.end ?? ""));

export function arcDates(database, arc) {
  const sessions = arc.arcType === "metaplot" ? metaplotArcs(database, arc.id).flatMap(child => arcSessions(database, child.id)) : arcSessions(database, arc.id);
  const dates = sessions.map(session => session.playDate).filter(Boolean).sort();
  return dates.length ? { start: dates[0], end: dates.at(-1) } : null;
}

export function areaAncestors(database, areaId) {
  const output = []; const seen = new Set(); let current = database.entities[areaId];
  while (current?.type === "area" && !seen.has(current.id)) { output.push(current); seen.add(current.id); current = database.entities[current.parentAreaId]; }
  return output;
}

export function expandedSessionMembers(database, session) {
  const ids = new Set(session.memberIds.filter(id => database.entities[id]));
  for (const id of [...ids]) {
    const entity = database.entities[id];
    for (const affiliationId of entity?.affiliationIds ?? []) if (database.entities[affiliationId]) ids.add(affiliationId);
    if (entity?.type === "scene") for (const area of areaAncestors(database, entity.areaId)) ids.add(area.id);
  }
  return [...ids];
}

export function inheritedMembers(database, arc) {
  const sessions = arc.arcType === "metaplot" ? metaplotArcs(database, arc.id).flatMap(child => arcSessions(database, child.id)) : arcSessions(database, arc.id);
  return [...new Set(sessions.flatMap(session => expandedSessionMembers(database, session)))];
}

export function publicationPaths(database, entityId) {
  const paths = [];
  for (const session of entitiesOf(database, "session")) {
    if (!expandedSessionMembers(database, session).includes(entityId)) continue;
    const arc = sessionArc(database, session);
    if (arc && (arc.status === "complete" || arc.keepPublished)) paths.push({ type: "arc", id: arc.id, sessionId: session.id });
    const metaplot = arc?.metaplotId ? database.entities[arc.metaplotId] : null;
    if (metaplot && (metaplot.status === "complete" || metaplot.keepPublished)) paths.push({ type: "metaplot", id: metaplot.id, sessionId: session.id });
  }
  return paths;
}

export function isPublic(database, entity) {
  if (!entity) return false;
  if (entity.visibility === VISIBILITY.GM) return false;
  if (entity.visibility === VISIBILITY.PUBLIC) return true;
  if (entity.type === "arc") return entity.status === "complete" || entity.keepPublished;
  if (entity.type === "session") { const arc = sessionArc(database, entity); return Boolean(arc && (arc.status === "complete" || arc.keepPublished)); }
  return publicationPaths(database, entity.id).length > 0;
}

export function publicationImpact(database, arcId) {
  const arc = database.entities[arcId]; if (arc?.type !== "arc") return { publish: 0, gmOnly: 0, entities: [] };
  const ids = inheritedMembers(database, arc); const entities = ids.map(id => database.entities[id]).filter(Boolean);
  return { publish: entities.filter(entity => entity.visibility === VISIBILITY.AUTOMATIC && !isPublic(database, entity)).length, gmOnly: entities.filter(entity => entity.visibility === VISIBILITY.GM).length, entities: ids };
}

export function eligibleSynopsisTerms(database, session) {
  const map = new Map();
  for (const id of expandedSessionMembers(database, session)) {
    const entity = database.entities[id]; if (!entity || entity.type === "affiliation") continue;
    for (const term of [entity.name, ...entity.aliases].filter(Boolean)) {
      const key = term.toLocaleLowerCase(); if (!map.has(key)) map.set(key, []); map.get(key).push({ entity, term });
    }
  }
  return map;
}

export function linkSynopsis(database, session, { player = false } = {}) {
  const source = String(session.synopsis ?? ""); const terms = eligibleSynopsisTerms(database, session);
  const matches = [];
  for (const [term, candidates] of terms) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");
    const match = pattern.exec(source); if (match) matches.push({ index: match.index, length: match[0].length, original: match[0], candidates, key: `${match.index}:${term}` });
  }
  matches.sort((a, b) => a.index - b.index || b.length - a.length);
  const accepted = []; let boundary = -1;
  for (const match of matches) {
    if (match.index < boundary) continue;
    const decision = session.synopsisDecisions?.[match.key];
    const candidate = decision === "unlinked" ? null : decision ? match.candidates.find(item => item.entity.id === decision) : match.candidates.length === 1 ? match.candidates[0] : null;
    accepted.push({ ...match, candidate, ambiguous: match.candidates.length > 1 && !decision }); boundary = match.index + match.length;
  }
  let html = ""; let cursor = 0;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  for (const match of accepted) {
    html += escape(source.slice(cursor, match.index));
    const target = match.candidate?.entity;
    html += target && (!player || isPublic(database, target)) ? `<button type="button" class="cw-inline-link" data-wiki-id="${target.id}">${escape(match.original)}</button>` : escape(match.original);
    cursor = match.index + match.length;
  }
  html += escape(source.slice(cursor));
  return { html: html.replace(/\n/g, "<br>"), ambiguous: accepted.filter(match => match.ambiguous) };
}

export function deriveAttention(database) {
  const items = [];
  const add = (kind, entityId, detail = {}) => items.push({ id: `${kind}:${entityId}:${detail.key ?? ""}`, kind, entityId, ...detail });
  for (const entity of Object.values(database.entities)) {
    if (["actor", "scene"].includes(entity.type) && entity.source?.missing) add(ATTENTION.MISSING_SOURCE, entity.id);
    if (entity.type === "actor" && entity.incomplete) add(ATTENTION.INCOMPLETE_ACTOR, entity.id);
    if (entity.type === "actor" && entity.dnpcAmbiguous) add(ATTENTION.DNPC, entity.id);
    if (entity.type === "scene" && entity.incomplete) add(ATTENTION.INCOMPLETE_SCENE, entity.id);
    if (entity.type === "image" && entity.incomplete) add(ATTENTION.INCOMPLETE_IMAGE, entity.id);
    if (entity.type === "area" && entity.incomplete) add(ATTENTION.INCOMPLETE_AREA, entity.id);
    if (entity.type === "affiliation" && entity.incomplete) add(ATTENTION.INCOMPLETE_AFFILIATION, entity.id);
    if (entity.type === "session") {
      if (!entity.art) add(ATTENTION.MISSING_SESSION_ART, entity.id);
      if (!entity.synopsis) add(ATTENTION.MISSING_SYNOPSIS, entity.id);
      for (const match of linkSynopsis(database, entity).ambiguous) add(ATTENTION.AMBIGUOUS_LINK, entity.id, { key: match.key, candidates: match.candidates.map(item => item.entity.id), text: match.original });
    }
    if (entity.type === "arc" && !entity.art) add(ATTENTION.MISSING_ARC_ART, entity.id);
  }
  return items.filter(item => !database.resolutions[item.id]);
}

export function historicalSuggestions(database, entity) {
  const terms = [entity.name, ...entity.aliases].filter(Boolean);
  const suggestions = [];
  for (const session of entitiesOf(database, "session")) {
    if (session.memberIds.includes(entity.id)) continue;
    for (const term of terms) {
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");
      const match = pattern.exec(session.synopsis); if (!match) continue;
      const key = `${ATTENTION.PREVIOUS_APPEARANCE}:${entity.id}:${session.id}:${match.index}`;
      if (!database.resolutions[key]) suggestions.push({ id: key, kind: ATTENTION.PREVIOUS_APPEARANCE, entityId: entity.id, sessionId: session.id, index: match.index, text: match[0] });
      break;
    }
  }
  return suggestions;
}

export function search(database, query, { player = false } = {}) {
  const needle = text(query).toLocaleLowerCase(); if (!needle) return [];
  const results = [];
  for (const entity of Object.values(database.entities)) {
    if (player && !isPublic(database, entity)) continue;
    const nameMatch = entity.name.toLocaleLowerCase().includes(needle);
    const alias = !player ? entity.aliases.find(value => value.toLocaleLowerCase().includes(needle)) : null;
    const synopsis = !player && entity.type === "session" && entity.synopsis.toLocaleLowerCase().includes(needle);
    if (nameMatch || alias || synopsis) results.push({ entity, match: alias ? "alias" : synopsis ? "synopsis" : "name", alias: alias ?? null });
  }
  return results.sort((a, b) => a.entity.name.localeCompare(b.entity.name));
}

export function validateDatabase(database) {
  const errors = [];
  if (database.schemaVersion !== SCHEMA_VERSION) errors.push(`Expected schema ${SCHEMA_VERSION}.`);
  for (const entity of Object.values(database.entities)) {
    if (entity.type === "session" && database.entities[entity.arcId]?.arcType !== "arc") errors.push(`Session ${entity.id} has no valid Arc.`);
    if (entity.type === "arc" && entity.arcType === "arc" && entity.metaplotId && database.entities[entity.metaplotId]?.arcType !== "metaplot") errors.push(`Arc ${entity.id} has an invalid Metaplot.`);
    if (entity.type === "area" && entity.parentAreaId && areaAncestors(database, entity.parentAreaId).some(area => area.id === entity.id)) errors.push(`Area ${entity.id} contains a cycle.`);
    for (const id of entity.affiliationIds ?? []) if (database.entities[id]?.type !== "affiliation") errors.push(`${entity.id} has an invalid Affiliation.`);
  }
  return errors;
}
