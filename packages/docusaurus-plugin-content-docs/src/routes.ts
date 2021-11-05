/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  Sidebar,
  SidebarItemCategory,
  SidebarItemCategoryLinkGeneratedIndex,
} from './sidebars/types';
import {PluginContentLoadedActions, RouteConfig} from '@docusaurus/types';
import {collectSidebarCategories} from './sidebars/utils';
import {docuHash, createSlugger} from '@docusaurus/utils';
import {LoadedVersion} from './types';
import {PropCategoryGeneratedIndex} from '@docusaurus/plugin-content-docs-types';

async function createSidebarRoutes({
  sidebarName,
  sidebar,
  versionPath,
  actions,
}: {
  sidebarName: string;
  sidebar: Sidebar;
  versionPath: string;
  actions: PluginContentLoadedActions;
}): Promise<RouteConfig[]> {
  const slugs = createSlugger();

  async function createCategoryGeneratedIndexRoute(
    category: SidebarItemCategory,
    link: SidebarItemCategoryLinkGeneratedIndex,
  ): Promise<RouteConfig> {
    const propFileName = slugs.slug(
      `${versionPath}-${sidebarName}-category-${category.label}`,
    );

    const prop: PropCategoryGeneratedIndex = {
      label: category.label,
      slug: link.slug,
      permalink: link.permalink,
    };

    const propData = await actions.createData(
      `${docuHash(`category/${propFileName}`)}.json`,
      JSON.stringify(prop, null, 2),
    );

    return {
      path: link.permalink,
      component: '@theme/DocCategoryGeneratedIndex',
      exact: true,
      modules: {
        categoryIndex: propData,
      },
    };
  }

  async function createCategoryRoute(
    category: SidebarItemCategory,
  ): Promise<RouteConfig | undefined> {
    if (category.link?.type === 'generated-index') {
      return createCategoryGeneratedIndexRoute(category, category.link);
    }
    return undefined;
  }

  const routes = await Promise.all(
    collectSidebarCategories(sidebar).map(createCategoryRoute),
  );

  return routes.filter(Boolean) as RouteConfig[];
}

export async function createSidebarsRoutes({
  version,
  actions,
}: {
  version: LoadedVersion;
  actions: PluginContentLoadedActions;
}): Promise<RouteConfig[]> {
  return (
    await Promise.all(
      Object.entries(version.sidebars).map(([sidebarName, sidebar]) =>
        createSidebarRoutes({
          sidebarName,
          sidebar,
          versionPath: version.versionPath,
          actions,
        }),
      ),
    )
  ).flat();
}
