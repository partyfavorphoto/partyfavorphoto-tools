# Form Filling Guide

## PDF Forms (email attachments)

When someone emails a PDF form (vendor application, W-9, insurance cert):

**On a system with Python:**
```bash
# Check for forms
python3 pdf_form_processor.py check-inbox

# Auto-process (download, fill, sign, send back)
python3 pdf_form_processor.py auto-process \
  --email-id <id> \
  --to-email sender@example.com
```

**On a system with Node.js (pdf-lib):**
```bash
node scripts/fill-pdf.mjs <input.pdf> <data.json> <output.pdf>
```

### QC Checklist
Before returning any form, verify:
- [ ] Phone is (202) 798-0610 (reject 555 numbers)
- [ ] Name is "Joe Lee" (not "Joseph Andrew Lee")
- [ ] Pricing math is correct ($249/hr or $349/hr)
- [ ] Discount is flat $100 (not percentage)
- [ ] Signature is an image, not text
- [ ] Page size is US Letter for US events

## Web Forms (MS Forms, Google Forms)

When someone sends a web form link:

```bash
# Scan the form to see fields
node forms/form-fill.mjs <url> inspect

# Auto-fill using default profile
node forms/form-fill.mjs <url> fill

# Auto-fill using specific profile
node forms/form-fill.mjs <url> fill spring-into-summer
```

### Profiles
Profiles are in `forms/profiles/`. Create new ones for specific events as needed.
The `default.json` profile has standard PFP business info.

### If the form has no fields
Some MS Forms are info-only pages with no actual input fields.
In that case, reply directly to the email with our vendor info.
