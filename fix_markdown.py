import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace **text** with <strong>text</strong> (non-greedy)
    content = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', content)

    # 2. Replace ### text with <h3>text</h3> (multiline)
    content = re.sub(r'^###\s*(.*)', r'<h3>\1</h3>', content, flags=re.MULTILINE)
    content = re.sub(r'^##\s*(.*)', r'<h2>\1</h2>', content, flags=re.MULTILINE)
    content = re.sub(r'^#\s*(.*)', r'<h1>\1</h1>', content, flags=re.MULTILINE)

    # 3. Handle list items
    # Remove markers if already inside <li>
    content = re.sub(r'<li>\s*[\-\*\u2022]\s*', r'<li>', content)
    
    # Convert raw lines starting with * or - or digits. to <li>
    content = re.sub(r'^\s*[\-\*]\s+(.*)', r'<li>\1</li>', content, flags=re.MULTILINE)
    content = re.sub(r'^\s*(\d+)\.\s+(.*)', r'<li>\2</li>', content, flags=re.MULTILINE)

    # Wrap adjacent <li> tags in <ul>
    # This is a bit tricky with regex but we can try to find blocks of <li>
    def wrap_li(match):
        return f'<ul>\n{match.group(0)}\n</ul>'
    
    # This matches one or more lines starting with <li> and ending with </li>
    # allowing for whitespace around them.
    content = re.sub(r'((?:^\s*<li>.*?</li>\s*?\n?)+)', wrap_li, content, flags=re.MULTILINE)

    # 4. Handle horizontal rules (--- or ***)
    content = re.sub(r'^\s*[\-\*]{3,}\s*$', r'<hr>', content, flags=re.MULTILINE)

    # 5. Handle [text](url)
    content = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', content)
    
    # 6. Clean up: if we have <ul> inside <ul>, fix it (can happen if already had <ul>)
    # Simple check for <ul>\n<ul>
    content = content.replace('<ul>\n<ul>', '<ul>')
    content = content.replace('</ul>\n</ul>', '</ul>')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    blog_dir = '/home/varsmana/adminko_site/site/public/blog/'
    for root, dirs, files in os.walk(blog_dir):
        for file in files:
            if file.endswith('.html'):
                file_path = os.path.join(root, file)
                process_file(file_path)

if __name__ == "__main__":
    main()
