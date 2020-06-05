import axios from "axios";

import { Engine, rateLimit } from "./index";

interface Repo {
  description: null | string;
  isArchived: boolean;
  isFork: boolean;
  name: string;
}

let getRepos: (() => Promise<Set<Repo>>) | undefined;
let org: string | undefined;

const engine: Engine = {
  id: "github",
  init: ({ organization, token }: { organization: string; token: string }) => {
    const client = axios.create({
      baseURL: "https://api.github.com",
      headers: { Authorization: `bearer ${token}` },
    });

    getRepos = rateLimit(async () => {
      let cursor: string | undefined;
      const repos = new Set<Repo>();
      while (true) {
        const {
          data,
        }: {
          data?: {
            organization: {
              repositories: {
                edges: { node: Repo }[];
                pageInfo: { endCursor: string; hasNextPage: boolean };
              };
            };
          };
        } = (
          await client.post(
            "/graphql",
            JSON.stringify({
              query: `query {
      organization(login: "${org}") { repositories(first: 100${
                cursor ? `, after: "${cursor}"` : ""
              }) {
          edges { node { description isArchived isFork name } }
          pageInfo { endCursor hasNextPage }
      } } }`,
            }),
          )
        ).data;

        if (!data) {
          break;
        }

        const { edges, pageInfo } = data.organization.repositories;
        edges.map(e => e.node).forEach(r => repos.add(r));

        if (pageInfo.hasNextPage) {
          cursor = pageInfo.endCursor;
        } else {
          break;
        }
      }

      return repos;
    }, 1);
    org = organization;
  },
  search: async q => {
    if (!(getRepos && org)) {
      throw Error("Client not initialized");
    }

    return Array.from(await getRepos())
      .filter(
        r =>
          !r.isArchived &&
          !r.isFork &&
          (r.description?.includes(q) || r.name.includes(q)),
      )
      .sort((a, b) => (a.name > b.name ? 1 : -1))
      .map(r => ({
        snippet: r.description || undefined,
        title: r.name,
        url: `https://github.com/${org}/${r.name}`,
      }));
  },
};

export default engine;