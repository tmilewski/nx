import { NxJsonConfiguration, readJson, Tree, updateJson } from '@nrwl/devkit';
import { createTreeWithEmptyWorkspace } from '@nrwl/devkit/testing';

import { cypressVersion } from '../../utils/versions';
import { cypressInitGenerator } from './init';

describe('init', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should add dependencies into `package.json` file', async () => {
    const existing = 'existing';
    const existingVersion = '1.0.0';
    updateJson(tree, 'package.json', (json) => {
      json.dependencies['@nrwl/cypress'] = cypressVersion;

      json.dependencies[existing] = existingVersion;
      json.devDependencies[existing] = existingVersion;
      return json;
    });
    cypressInitGenerator(tree, {});
    const packageJson = readJson(tree, 'package.json');

    expect(packageJson.devDependencies.cypress).toBeDefined();
    expect(packageJson.devDependencies['@nrwl/cypress']).toBeDefined();
    expect(packageJson.devDependencies['@types/node']).toBeDefined();
    expect(packageJson.devDependencies[existing]).toBeDefined();
    expect(packageJson.dependencies['@nrwl/cypress']).toBeUndefined();
    expect(packageJson.dependencies[existing]).toBeDefined();
  });

  it('should setup e2e target defaults', async () => {
    updateJson<NxJsonConfiguration>(tree, 'nx.json', (json) => {
      json.namedInputs ??= {};
      json.namedInputs.production = ['default'];
      return json;
    });

    cypressInitGenerator(tree, {});

    expect(
      readJson<NxJsonConfiguration>(tree, 'nx.json').targetDefaults.e2e
    ).toEqual({
      inputs: ['default', '^production'],
    });
  });
});
