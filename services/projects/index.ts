/**
 * Projects service.
 *
 * Owns the project collection. References an owner by `ownerId` only — it never
 * imports the users service. Independently extractable into its own microservice.
 */
import type { Project, ProjectCreate, ProjectUpdate } from "@/lib/types";
import { ServiceError, notFound } from "@/lib/service-error";

const SEED: Project[] = [
  { id: 1, name: "AP Agent Platform", desc: "Always-on agent system with Discord command interface.", ownerId: 2, created: "2026-04-10" },
  { id: 2, name: "Standard Kit v2", desc: "Reusable PRD/BRD templates and agent definitions.", ownerId: 1, created: "2026-04-22" },
  { id: 3, name: "DAS Operation Guide", desc: "Dev Agent System operations and workflow docs.", ownerId: 3, created: "2026-03-30" },
  { id: 4, name: "Hermes Agent", desc: "Experimental human-in-the-loop agent runtime.", ownerId: 1, created: "2026-05-15" },
];

const g = globalThis as unknown as { __taskflowProjects?: Project[] };
const store: Project[] = (g.__taskflowProjects ??= structuredClone(SEED));

const nextId = () => (store.length ? Math.max(...store.map((p) => p.id)) + 1 : 1);

export const ProjectsService = {
  list(): Project[] {
    return structuredClone(store);
  },

  get(id: number): Project {
    const p = store.find((x) => x.id === id);
    if (!p) throw notFound("Project");
    return structuredClone(p);
  },

  create(input: ProjectCreate): Project {
    const name = input.name?.trim();
    if (!name) throw new ServiceError("Name is required");
    const project: Project = {
      id: nextId(),
      name,
      desc: input.desc?.trim() ?? "",
      ownerId: input.ownerId,
      created: TODAY(),
    };
    store.push(project);
    return structuredClone(project);
  },

  update(id: number, patch: ProjectUpdate): Project {
    const p = store.find((x) => x.id === id);
    if (!p) throw notFound("Project");
    if (patch.name !== undefined) {
      if (!patch.name.trim()) throw new ServiceError("Name is required");
      p.name = patch.name.trim();
    }
    if (patch.desc !== undefined) p.desc = patch.desc.trim();
    if (patch.ownerId !== undefined) p.ownerId = patch.ownerId;
    return structuredClone(p);
  },

  remove(id: number): void {
    const i = store.findIndex((x) => x.id === id);
    if (i === -1) throw notFound("Project");
    store.splice(i, 1);
  },
};

function TODAY() {
  // Match the prototype's fixed "today".
  return "2026-06-04";
}
