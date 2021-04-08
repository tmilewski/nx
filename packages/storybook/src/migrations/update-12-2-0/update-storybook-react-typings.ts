import * as path from 'path';
import {
  chain,
  Tree,
  SchematicContext,
  Rule,
} from '@angular-devkit/schematics';

import {
  formatFiles,
  readJsonInTree,
  updateWorkspaceInTree,
  serializeJson,
} from '@nrwl/workspace';
import { offsetFromRoot } from '@nrwl/devkit';

import { isFramework, TsConfig } from '../../utils/utilities';
import { normalize } from '@angular-devkit/core';

interface ProjectDefinition {
  root: string;
  sourceRoot: string;
  projectType: 'library' | 'application';

  schematic?: Record<string, any>;
  architect: Record<
    string,
    import('@angular-devkit/core').workspaces.TargetDefinition
  >;
}

export default function (tree: Tree, context: SchematicContext) {
  return chain([update, formatFiles()]);
}

function update(tree: Tree, context: SchematicContext): Rule {
  return updateWorkspaceInTree((config, context, tree) => {
    Object.entries<ProjectDefinition>(config.projects).forEach(
      ([projectName, projectConfig]) => {
        updateTsconfig(tree, context, { projectName, projectConfig });
      }
    );

    return config;
  });
}

function updateTsconfig(
  tree: Tree,
  context: SchematicContext,
  options: {
    projectName: string;
    projectConfig: ProjectDefinition;
  }
) {
  const architect = options.projectConfig.architect;
  const storybookRoot = path.join(options.projectConfig.root, '.storybook');

  const paths = {
    tsConfigStorybook: normalize(
      path.join(options.projectConfig.root, '.storybook/tsconfig.json')
    ),
  };

  const hasStorybookConfig =
    architect.storybook && tree.exists(paths.tsConfigStorybook);

  if (!hasStorybookConfig) {
    context.logger.info(
      `${options.projectName}: no storybook configured. skipping migration...`
    );
    return;
  }

  const isReactProject = isFramework('react', {
    uiFramework: architect.storybook.options?.uiFramework as Parameters<
      typeof isFramework
    >[1]['uiFramework'],
  });

  const tsConfig = {
    storybook: readJsonInTree<TsConfig>(tree, paths.tsConfigStorybook),
  };

  if (isReactProject) {
    tsConfig.storybook.files = tsConfig.storybook.files || [];
    tsConfig.storybook.files = uniqueArray([
      ...tsConfig.storybook.files,
      `${offsetFromRoot(
        storybookRoot
      )}node_modules/@nrwl/react/typings/cssmodule.d.ts`,
      `${offsetFromRoot(
        storybookRoot
      )}node_modules/@nrwl/react/typings/image.d.ts`,
    ]);
    tree.overwrite(paths.tsConfigStorybook, serializeJson(tsConfig.storybook));
  }
}

function uniqueArray<T extends Array<any>>(value: T) {
  return [...new Set(value)] as T;
}
