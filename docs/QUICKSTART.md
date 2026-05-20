# Quote & Contract Quickstart

## Sending a Quote

```bash
# Generate and save as PDF
node quotes/generate.mjs "Client Name" "Event Name" 4 premium

# Send as HTML email (requires .env with SUPABASE_SERVICE_ROLE_KEY)
node quotes/send-email.mjs "client@email.com" "Client Name" "Event Name" 4 premium
```

### Arguments
- `"Client Name"` - Client's full name
- `"Event Name"` - Name of the event
- `4` - Number of hours (2, 3, 4, 5, or 6)
- `premium` - Omit for standard (2x6 strips), use "premium" for 4x6 prints

### Examples
```bash
# Hannah at DC JazzFest, 4hr Premium
node quotes/send-email.mjs "hannah@dcjazzfest.org" "Hannah Kuhns" "DC JazzFest" 4 premium

# Ashley at Spring Into Summer, 3hr Standard
node quotes/send-email.mjs "croughanashley@gmail.com" "Ashley" "Spring Into Summer" 3
```

## Generating Contracts

```bash
# Generate all 10 contract templates
node contracts/generate.mjs
```

Output: `contracts/PFP-{hours}hr-{Standard|Premium}-Contract.pdf`

### Which contract to send
- 2hr Standard ($498) - Short events, 2x6 strips
- 4hr Premium ($1,396) - Full event, premium prints
- 6hr Premium ($2,094) - All-day coverage

## Pricing Reference
| Hours | Standard ($249/hr) | Premium ($349/hr) |
|-------|--------------------|--------------------|
| 2 | $498 ($398 disc) | $698 ($598 disc) |
| 3 | $747 ($647 disc) | $1,047 ($947 disc) |
| 4 | $996 ($896 disc) | $1,396 ($1,296 disc) |
| 5 | $1,245 ($1,145 disc) | $1,745 ($1,645 disc) |
| 6 | $1,494 ($1,394 disc) | $2,094 ($1,994 disc) |
