import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ModuleInfo {
  name: string;
  path: string;
  type: 'frontend' | 'backend' | 'package';
  components: string[];
  routes: string[];
  status: 'complete' | 'partial' | 'missing';
}

interface CodebaseContext {
  modules: ModuleInfo[];
  frontendPages: string[];
  backendRoutes: string[];
  packages: string[];
  summary: string;
}

export function analyzeCodebase(projectRoot: string): CodebaseContext {
  const context: CodebaseContext = {
    modules: [],
    frontendPages: [],
    backendRoutes: [],
    packages: [],
    summary: ''
  };

  // Analyze frontend structure
  const frontendAppPath = join(projectRoot, 'apps', 'frontend', 'app');
  if (existsSync(frontendAppPath)) {
    const dashboardPath = join(frontendAppPath, 'dashboard');
    if (existsSync(dashboardPath)) {
      const dashboardItems = readdirSync(dashboardPath, { withFileTypes: true });
      dashboardItems.forEach(item => {
        if (item.isDirectory()) {
          context.frontendPages.push(item.name);
        }
      });
    }

    const authPath = join(frontendAppPath, 'auth');
    if (existsSync(authPath)) {
      const authItems = readdirSync(authPath, { withFileTypes: true });
      authItems.forEach(item => {
        if (item.isDirectory()) {
          context.frontendPages.push(`auth/${item.name}`);
        }
      });
    }
  }

  // Analyze backend routes
  const backendRoutesPath = join(projectRoot, 'apps', 'backend', 'src', 'routes');
  if (existsSync(backendRoutesPath)) {
    const routeFiles = readdirSync(backendRoutesPath);
    context.backendRoutes = routeFiles
      .filter(file => file.endsWith('.ts'))
      .map(file => file.replace('.ts', ''));
  }

  // Analyze packages/modules
  const modulesPath = join(projectRoot, 'packages', 'modules');
  if (existsSync(modulesPath)) {
    const moduleDirs = readdirSync(modulesPath, { withFileTypes: true });
    moduleDirs.forEach(dir => {
      if (dir.isDirectory()) {
        const modulePath = join(modulesPath, dir.name);
        const packageJsonPath = join(modulePath, 'package.json');
        
        let status: 'complete' | 'partial' | 'missing' = 'partial';
        let components: string[] = [];
        let routes: string[] = [];

        if (existsSync(packageJsonPath)) {
          try {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            status = 'complete';
          } catch {
            status = 'partial';
          }
        }

        const srcPath = join(modulePath, 'src');
        if (existsSync(srcPath)) {
          const srcItems = readdirSync(srcPath, { withFileTypes: true });
          srcItems.forEach(item => {
            if (item.isFile() && item.name.endsWith('.tsx')) {
              components.push(item.name.replace('.tsx', ''));
            }
            if (item.isFile() && item.name.endsWith('.ts')) {
              components.push(item.name.replace('.ts', ''));
            }
          });
        }

        context.modules.push({
          name: dir.name,
          path: modulePath,
          type: 'package',
          components,
          routes,
          status
        });
      }
    });
  }

  // Generate summary
  context.summary = `
BetterMe Project Structure Analysis:

Frontend Pages (${context.frontendPages.length}):
${context.frontendPages.map(page => `- ${page}`).join('\n')}

Backend Routes (${context.backendRoutes.length}):
${context.backendRoutes.map(route => `- ${route}`).join('\n')}

Modules/Packages (${context.modules.length}):
${context.modules.map(mod => `- ${mod.name} (${mod.status})`).join('\n')}

Total Implementation Status:
- Complete modules: ${context.modules.filter(m => m.status === 'complete').length}
- Partial modules: ${context.modules.filter(m => m.status === 'partial').length}
- Missing modules: ${context.modules.filter(m => m.status === 'missing').length}
  `.trim();

  return context;
}
