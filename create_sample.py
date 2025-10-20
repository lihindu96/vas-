"""
Script to generate a sample Excel template for inbound data
"""
import pandas as pd
import os

# Create sample data
sample_data = {
    'PO Number': ['PO-001', 'PO-001', 'PO-002', 'PO-003'],
    'Item Code': ['ITEM-A001', 'ITEM-A002', 'ITEM-B001', 'ITEM-C001'],
    'Item Description': ['Widget Type A', 'Widget Type B', 'Gadget Model X', 'Component Z'],
    'Quantity': [100, 150, 200, 50],
    'Supplier': ['Supplier ABC', 'Supplier ABC', 'Supplier XYZ', 'Supplier DEF']
}

df = pd.DataFrame(sample_data)

# Create samples directory
os.makedirs('samples', exist_ok=True)

# Save template
df.to_excel('samples/inbound_template.xlsx', index=False)

print("Sample Excel template created: samples/inbound_template.xlsx")
print("\nTemplate structure:")
print(df.to_string(index=False))
