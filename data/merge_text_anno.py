import csv

def merge_data():
    texts_path = 'texts.txt'
    annotations_path = 'annotations.csv'
    output_path = 'merged_data.csv'

    # Mappings
    theme_map = {
        'P': 'priroda',
        'S': 'svetova-politika',
        'Z': 'zdravi',
        'D': 'domaci-politika'
    }

    # Read texts
    with open(texts_path, 'r', encoding='utf-8') as f:
        texts = [line.strip() for line in f if line.strip()]

    # Read annotations
    annotations = []
    with open(annotations_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if row:
                annotations.append(row)

    # Check lengths
    if len(texts) != len(annotations):
        print(f"Warning: Number of texts ({len(texts)}) does not match number of annotations ({len(annotations)})")
    
    # Prepare output data
    output_data = []
    
    # Header
    header = ['index', 'content', 'theme', 'manip', 'dezinfo']
    output_data.append(header)

    # Merge
    for i, (text, anno) in enumerate(zip(texts, annotations)):
        # anno structure: [index, theme, manip, dezinfo]
        # Note: anno[0] is the index from the file, but we might want to use loop index or file index.
        # The prompt says "index" in header. I will use the index from the annotation file if available, or generate one.
        # Annotation file has index in first column.
        
        idx = anno[0]
        theme_code = anno[1]
        manip_code = anno[2]
        dezinfo_code = anno[3]

        # Map theme
        theme = theme_map.get(theme_code, theme_code)

        # Map manip: true if M else O (False)
        manip = True if manip_code == 'M' else False

        # Map dezinfo: true if D else false
        dezinfo = True if dezinfo_code == 'D' else False

        output_data.append([idx, text, theme, manip, dezinfo])

    # Write to CSV
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(output_data)

    print(f"Successfully created {output_path} with {len(output_data)-1} records.")

if __name__ == "__main__":
    merge_data()
