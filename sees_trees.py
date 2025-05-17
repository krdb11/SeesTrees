import os

# ANSI color codes
class Colors:
    FOLDER = '\033[1;34m'          # Bold Blue
    CONFIG = '\033[1;33m'          # Bold Yellow
    PYTHON = '\033[1;32m'          # Bold Green
    DOCS = '\033[1;36m'            # Bold Cyan
    JSON = '\033[1;35m'            # Bold Magenta
    LOCK = '\033[1;31m'            # Bold Red
    IMAGE = '\033[38;5;213m'       # Pink
    NPM = '\033[38;5;208m'         # Orange
    HTML = '\033[38;5;202m'        # Deep Orange
    CSS = '\033[38;5;39m'          # Light Blue
    JS = '\033[38;5;220m'          # Gold
    TS = '\033[38;5;45m'           # Turquoise
    YAML = '\033[38;5;177m'        # Purple
    SQL = '\033[38;5;147m'         # Light Purple
    CSV = '\033[38;5;107m'         # Olive
    RESET = '\033[0m'              # Reset color

def get_file_color_and_emoji(filename):
    """
    Returns appropriate emoji and color based on file type.
    """
    ext = os.path.splitext(filename)[1].lower()
    name = os.path.basename(filename)
    
    # Default --> white
    color = Colors.RESET
    emoji = '📄'
    
    # File type definitions
    file_types = {
        # Programmatic
        '.py': (Colors.PYTHON, '🐍'),
        '.js': (Colors.JS, '📜'),
        '.jsx': (Colors.JS, '⚛️'),
        '.ts': (Colors.TS, '💠'),
        '.tsx': (Colors.TS, '⚛️'),
        
        # Web
        '.html': (Colors.HTML, '🌐'),
        '.css': (Colors.CSS, '🎨'),
        
        # Data
        '.json': (Colors.JSON, '📋'),
        '.yaml': (Colors.YAML, '📋'),
        '.yml': (Colors.YAML, '📋'),
        '.sql': (Colors.SQL, '💾'),
        '.csv': (Colors.CSV, '📊'),
        
        # Configuration
        '.toml': (Colors.CONFIG, '⚙️'),
        '.env': (Colors.CONFIG, '⚙️'),
        '.lock': (Colors.LOCK, '🔒'),
        
        # Documentation
        '.md': (Colors.DOCS, '📝'),
        '.txt': (Colors.DOCS, '📝'),
        '.rst': (Colors.DOCS, '📝'),
        
        # Images
        '.png': (Colors.IMAGE, '🖼️'),
        '.jpg': (Colors.IMAGE, '🖼️'),
        '.jpeg': (Colors.IMAGE, '🖼️'),
        '.gif': (Colors.IMAGE, '🖼️'),
        '.svg': (Colors.IMAGE, '🖼️'),
    }
    
    # Special cases for special filenames :)
    special_files = {
        'package.json': (Colors.NPM, '📦'),
        'package-lock.json': (Colors.LOCK, '🔒'),
        'pyproject.toml': (Colors.PYTHON, '🐍'),
        'poetry.lock': (Colors.LOCK, '🔒'),
        '.gitignore': (Colors.CONFIG, '👁️'),
        '.env': (Colors.CONFIG, '⚙️'),
    }
    
    # Check special files first
    if name in special_files:
        return special_files[name]
    
    # Then check file extensions
    if ext in file_types:
        return file_types[ext]
    
    return color, emoji

def should_ignore(path):
    """
    Check if a path should be ignored based on common patterns
    """
    ignore_patterns = {
        '.git', '__pycache__', 'node_modules',
        '.vscode', '.idea', '*.pyc', '.DS_Store',
        'venv', 'env', 'build', 'dist', '*.egg-info',
        '.next', 'bin', '.ipynb_checkpoints', 'obj'
    }
    
    name = os.path.basename(path)
    return any(
        name == pattern or 
        (pattern.startswith('*.') and name.endswith(pattern[1:]))
        for pattern in ignore_patterns
    )

def print_directory_tree(directory, prefix="", is_root=True):
    """
    Recursively prints the directory tree structure with colors and emojis for a clear, professional overview.
    """
    try:
        if is_root:
            print(f"\n🌳 {Colors.FOLDER}Project Structure{Colors.RESET}")
            print("==================")
            
            # Print root config files first
            root_files = [f for f in os.listdir(directory) 
                         if os.path.isfile(os.path.join(directory, f)) and 
                         not should_ignore(os.path.join(directory, f))]
            root_files.sort()
            
            for file in root_files:
                color, emoji = get_file_color_and_emoji(file)
                print(f"├── {emoji} {color}{file}{Colors.RESET}")
            print("│")
        
        items = [item for item in os.listdir(directory) 
                if not should_ignore(os.path.join(directory, item)) and 
                (not is_root or os.path.isdir(os.path.join(directory, item)))]
        items.sort(key=lambda x: (not os.path.isdir(os.path.join(directory, x)), x))

        for index, item in enumerate(items):
            is_last = (index == len(items) - 1)
            connector = "└── " if is_last else "├── "
            next_prefix = "    " if is_last else "│   "
            
            item_path = os.path.join(directory, item)
            
            if os.path.isdir(item_path):
                color = Colors.FOLDER
                emoji = "📂"
            else:
                color, emoji = get_file_color_and_emoji(item)
            
            print(f"{prefix}{connector}{emoji} {color}{item}{Colors.RESET}")

            if os.path.isdir(item_path):
                print_directory_tree(item_path, prefix + next_prefix, False)

    except PermissionError:
        print(f"{prefix} ⛔ [Permission denied]")
    except Exception as e:
        print(f"{prefix} ⚠️ [Error: {str(e)}]")

def main():
    """
    Main function to show complete project structure.
    """
    root_dir = os.getcwd()
    print_directory_tree(root_dir)

if __name__ == "__main__":
    
    main()
