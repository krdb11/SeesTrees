import os
import subprocess
from pathlib import Path
from datetime import datetime
import fnmatch

class Colors:
    FOLDER = '\033[1;34m'
    CONFIG = '\033[1;33m'
    PYTHON = '\033[1;32m'
    DOCS = '\033[1;36m'
    JSON = '\033[1;35m'
    LOCK = '\033[1;31m'
    IMAGE = '\033[38;5;213m'
    NPM = '\033[38;5;208m'
    HTML = '\033[38;5;202m'
    CSS = '\033[38;5;39m'
    JS = '\033[38;5;220m'
    TS = '\033[38;5;45m'
    YAML = '\033[38;5;177m'
    SQL = '\033[38;5;147m'
    CSV = '\033[38;5;107m'
    
    PYTHON_ENV = '\033[38;5;46m'
    NODE_ENV = '\033[38;5;214m'
    DOCKER_ENV = '\033[38;5;33m'
    RUBY_ENV = '\033[38;5;196m'
    GO_ENV = '\033[38;5;75m'
    JAVA_ENV = '\033[38;5;166m'
    PHP_ENV = '\033[38;5;105m'
    
    GIT_ADD = '\033[38;5;40m'
    GIT_MOD = '\033[38;5;214m'
    GIT_DEL = '\033[38;5;196m'
    GIT_REN = '\033[38;5;105m'
    GIT_UNT = '\033[38;5;245m'
    
    GLOW_START = '\033[7m'
    GLOW_END = '\033[27m'
    BLINK = '\033[5m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    ITALIC = '\033[3m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'

class EnvMarkers:
    PYTHON_VENV = "🟢"
    PYTHON_POETRY = "🔵"
    NODE_ENV = "🟠"
    DOCKER_ENV = "🐳"
    RUBY_ENV = "💎"
    GO_ENV = "🔹"
    JAVA_ENV = "☕"
    PHP_ENV = "🐘"
    POWER_SOURCE = "⚡"
    POWER_FLOW = "✨"
    
    GIT_ADD = "⚡"
    GIT_MOD = "🔌"
    GIT_DEL = "💥"
    GIT_REN = "➡️"
    GIT_UNT = "⭕"

class FileTypes:
    EXTENSIONS = {
        '.py': ('🐍', Colors.PYTHON),
        '.ts': ('📘', Colors.TS),
        '.js': ('📜', Colors.JS),
        '.jsx': ('⚛️', Colors.JS),
        '.tsx': ('⚛️', Colors.TS),
        '.json': ('📦', Colors.JSON),
        '.yml': ('⚙️', Colors.YAML),
        '.yaml': ('⚙️', Colors.YAML),
        '.toml': ('⚙️', Colors.CONFIG),
        '.ini': ('⚙️', Colors.CONFIG),
        '.md': ('📚', Colors.DOCS),
        '.rst': ('📚', Colors.DOCS),
        '.txt': ('📄', Colors.DOCS),
        '.png': ('🖼️', Colors.IMAGE),
        '.jpg': ('🖼️', Colors.IMAGE),
        '.svg': ('🎨', Colors.IMAGE),
        '.html': ('🌐', Colors.HTML),
        '.css': ('🎨', Colors.CSS),
        '.scss': ('🎨', Colors.CSS),
        '.sass': ('🎨', Colors.CSS),
    }

class GitStatus:
    def __init__(self, repo_path):
        self.repo_path = repo_path
        self.status = self._run_git_command(['git', 'status', '--porcelain'])
        self.branch = self._run_git_command(['git', 'branch', '--show-current'])
        self.last_commit = self._run_git_command(['git', 'log', '-1', '--format=%h %s'])
        
        self.status = {
            line[3:]: line[:2].strip()
            for line in self.status.splitlines()
        } if self.status else {}
        
    def _run_git_command(self, command):
        try:
            result = subprocess.run(command, cwd=self.repo_path, capture_output=True, text=True)
            return result.stdout.strip()
        except:
            return ""

    def get_file_status(self, file_path):
        try:
            relative_path = str(Path(file_path).relative_to(self.repo_path))
            if isinstance(self.status, dict):
                return self.status.get(relative_path, '')
            else:
                return ''
        except ValueError:
            return ''

class EnvironmentDetector:
    ENV_CONFIGS = {
        'python': {
            'files': ['venv', 'env', '.venv', 'pyproject.toml', 'requirements.txt'],
            'marker': EnvMarkers.PYTHON_VENV,
            'color': Colors.PYTHON_ENV,
            'power_level': 3
        },
        'node': {
            'files': ['package.json'],
            'marker': EnvMarkers.NODE_ENV,
            'color': Colors.NODE_ENV,
            'power_level': 3
        },
        'docker': {
            'files': ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml'],
            'marker': EnvMarkers.DOCKER_ENV,
            'color': Colors.DOCKER_ENV,
            'power_level': 4
        },
        'ruby': {
            'files': ['Gemfile'],
            'marker': EnvMarkers.RUBY_ENV,
            'color': Colors.RUBY_ENV,
            'power_level': 2
        },
        'go': {
            'files': ['go.mod'],
            'marker': EnvMarkers.GO_ENV,
            'color': Colors.GO_ENV,
            'power_level': 2
        },
        'java': {
            'files': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
            'marker': EnvMarkers.JAVA_ENV,
            'color': Colors.JAVA_ENV,
            'power_level': 3
        },
        'php': {
            'files': ['composer.json'],
            'marker': EnvMarkers.PHP_ENV,
            'color': Colors.PHP_ENV,
            'power_level': 2
        }
    }

    @staticmethod
    def detect_environments(directory):
        environments = {}
        
        for env_name, config in EnvironmentDetector.ENV_CONFIGS.items():
            if any(os.path.exists(os.path.join(directory, f)) for f in config['files']):
                if env_name == 'python' and os.path.exists(os.path.join(directory, 'pyproject.toml')):
                    try:
                        with open(os.path.join(directory, 'pyproject.toml'), 'r') as f:
                            if '[tool.poetry]' in f.read():
                                config['marker'] = EnvMarkers.PYTHON_POETRY
                    except:
                        pass
                
                environments[env_name] = {
                    'type': env_name,
                    'marker': config['marker'],
                    'color': config['color'],
                    'power_level': config['power_level']
                }
        
        return environments

def get_default_ignore_patterns():
    return {
        '.git', '.svn', '.hg',
        '.vscode-test', '.vscode-linux-x64-*',
        'node_modules.asar', 'node_modules.asar.unpacked',
        'node_modules', '__pycache__', '.pytest_cache',
        'build', 'dist', '*.pyc', '*.pyo', '*.pyd',
        '.idea', '.vs', '*.swp', '*.swo',
        '.DS_Store', 'Thumbs.db',
        '*.log', '*.sqlite',
        '.env', '.venv', 'env/', 'venv/', 'ENV/',
        'out', '.history', '*.vsix', '.vscode-test.*'
    }

def parse_gitignore(repo_path):
    patterns = get_default_ignore_patterns()
    gitignore_path = Path(repo_path) / '.gitignore'
    
    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            patterns.update(
                line.strip()[:-1] if line.strip().endswith('/') else line.strip()
                for line in f
                if line.strip() and not line.startswith('#')
            )
    
    return patterns

def should_ignore(path, ignore_patterns):
    if not ignore_patterns:
        return False
        
    try:
        abs_path = str(path.absolute())
        if any(vscode_dir in abs_path for vscode_dir in ['vscode-linux-x64', 'node_modules.asar', 'completions']):
            return True
            
        path_str = str(path.relative_to(path.parent))
        
        if path_str in ignore_patterns:
            return True
            
        for pattern in ignore_patterns:
            if (pattern.startswith('*') and fnmatch.fnmatch(path_str, pattern)) or \
               (pattern.startswith('/') and fnmatch.fnmatch(str(path), pattern[1:])) or \
               fnmatch.fnmatch(path_str, pattern) or \
               (path.is_dir() and fnmatch.fnmatch(f"{path_str}/", f"{pattern}/")):
                return True
                    
    except ValueError:
        return False
    
    return False

def generate_power_grid_effect(power_level, text):
    if power_level <= 0:
        return text
    
    effects = {
        1: f"{Colors.GLOW_START}{text}{Colors.GLOW_END}",
        2: f"{Colors.BOLD}{text}{Colors.RESET}",
        3: f"{Colors.BOLD}{Colors.GLOW_START}{text}{Colors.GLOW_END}{Colors.RESET}",
        4: f"{Colors.BOLD}{Colors.GLOW_START} {text} {Colors.GLOW_END}{Colors.RESET}",
        5: f"{Colors.BLINK}{Colors.BOLD}{Colors.GLOW_START} {text} {Colors.GLOW_END}{Colors.RESET}"
    }
    
    return effects.get(min(power_level, 5), text)

def calculate_power_level(path, environments):
    power_level = 0
    
    if path.name in ['package.json', 'pyproject.toml', 'Dockerfile']:
        power_level += 3
    
    if path.suffix in ['.py', '.ts', '.js']:
        power_level += 2
        
    if path.suffix in ['.json', '.yml', '.toml']:
        power_level += 1
        
    if environments:
        power_level += max(env['power_level'] for env in environments.values())
    
    return min(power_level, 5)

def get_file_icon(file_path):
    ext = file_path.suffix.lower()
    name = file_path.name.lower()
    
    if name.startswith('.') or name in ['dockerfile', 'makefile']:
        return "⚙️", Colors.CONFIG
    
    if name in ['package.json', 'package-lock.json']:
        return "📦", Colors.NPM
    
    if name in ['readme.md', 'changelog.md', 'license']:
        return "📚", Colors.DOCS
    
    return FileTypes.EXTENSIONS.get(ext, ("📄", Colors.RESET))

def get_status_marker(status, power_level):
    markers = {
        'A': f"{Colors.GIT_ADD}{EnvMarkers.GIT_ADD * power_level}{Colors.RESET}",
        'M': f"{Colors.GIT_MOD}{EnvMarkers.GIT_MOD}{Colors.RESET}",
        'D': f"{Colors.GIT_DEL}{EnvMarkers.GIT_DEL}{Colors.RESET}",
        'R': f"{Colors.GIT_REN}{EnvMarkers.GIT_REN}{Colors.RESET}",
        '??': f"{Colors.GIT_UNT}{EnvMarkers.GIT_UNT}{Colors.RESET}"
    }
    return markers.get(status, '')

def display_tree(directory, git_status=None, indent="", prefix="", ignore_patterns=None):
    if ignore_patterns is None:
        ignore_patterns = parse_gitignore(directory)
    
    path = Path(directory)
    entries = sorted(path.iterdir(), key=lambda x: (not x.is_dir(), x.name.lower()))
    entries = [entry for entry in entries if not should_ignore(entry, ignore_patterns)]
    
    for i, entry in enumerate(entries):
        is_last = i == len(entries) - 1
        current_prefix = "└── " if is_last else "├── "
        next_indent = indent + ("    " if is_last else "│   ")
        
        status = ""
        if git_status:
            file_status = git_status.get_file_status(entry)
            if file_status:
                status_map = {'A': Colors.GIT_ADD, 'M': Colors.GIT_MOD, 'D': Colors.GIT_DEL,
                            'R': Colors.GIT_REN, '??': Colors.GIT_UNT}
                marker_map = {'A': EnvMarkers.GIT_ADD, 'M': EnvMarkers.GIT_MOD, 'D': EnvMarkers.GIT_DEL,
                            'R': EnvMarkers.GIT_REN, '??': EnvMarkers.GIT_UNT}
                
                for key in status_map:
                    if key in file_status:
                        status = f"{status_map[key]}{marker_map[key]}{Colors.RESET}"
                        break
        
        if entry.is_dir():
            envs = EnvironmentDetector.detect_environments(entry)
            env_markers = "".join(f"{env['color']}{env['marker']}" for env in envs.values())
            
            print(f"{indent}{current_prefix}{Colors.FOLDER}📁 {entry.name}{Colors.RESET} {status}{env_markers}")
            display_tree(entry, git_status, next_indent, prefix, ignore_patterns)
        else:
            icon, color = get_file_icon(entry)
            print(f"{indent}{current_prefix}{color}{icon} {entry.name}{Colors.RESET} {status}")

def main():
    repo_path = Path.cwd()
    git_status = GitStatus(repo_path)
    ignore_patterns = parse_gitignore(repo_path)
    
    print(f"\nRepository: {repo_path}")
    print(f"Branch: {git_status.branch}")
    print(f"Last Commit: {git_status.last_commit}")
    print("\n" + "=" * 50 + "\n")
    
    display_tree(repo_path, git_status, ignore_patterns=ignore_patterns)

if __name__ == "__main__":
    main()
