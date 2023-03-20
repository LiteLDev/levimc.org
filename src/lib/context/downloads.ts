import type { GetStaticProps } from "next";
import { createContext } from "react";

import type { Build } from "@/lib/service/types";
import { getProject, getVersionBuilds } from "@/lib/service/v2";

export interface DownloadsContextProps {
  projectId: string;
  project?: ProjectDescriptor;
  builds?: Build[];
}

export interface ProjectDescriptor {
  name: string;
  latestVersion: string;
  latestVersionGroup: string;
}

export interface ProjectProps {
  project: ProjectDescriptor;
}

export const DownloadsContext = createContext<DownloadsContextProps>({
  projectId: "paper",
  project: undefined,
  builds: undefined,
});

const isVersionStable = async (
  project: string,
  version: string
): Promise<boolean> => {
  const { builds } = await getVersionBuilds(project, version);
  for (let i = builds.length - 1; i >= 0; i--) {
    if (builds[i].channel === "default") return true;
  }

  return false;
};

export const getProjectProps = (id: string): GetStaticProps => {
  return async () => {
    const { project_name, versions, version_groups } = await getProject(id);

    let latestVersion = versions[versions.length - 1];
    for (let i = versions.length - 1; i >= 0; i--) {
      if (await isVersionStable(id, versions[i])) {
        latestVersion = versions[i];
        break;
      }
    }

    const project = {
      name: project_name,
      latestVersion,
      latestVersionGroup: version_groups[version_groups.length - 1],
    };

    return {
      props: {
        project,
      },
      revalidate: 600, // 10 minutes
    };
  };
};
