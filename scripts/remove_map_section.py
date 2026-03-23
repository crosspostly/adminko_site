import os
import re

directory = '/home/varsmana/adminko_site/site/public/blog/'
# Pattern to match the "Карта" section and its preceding comment if it exists.
pattern = re.compile(r'(<!-- Карта -->\s*)?<section class="w-full mt-24 mb-16 px-4">.*?</section>', re.DOTALL)

updated_count = 0
for filename in os.listdir(directory):
    if filename.endswith('.html'):
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            new_content = pattern.sub('', content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {filename}")
                updated_count += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")

print(f"Total files updated: {updated_count}")
