# DPA Shipping Lines Directory

A modern shipping agent directory and line representation management system built using React, TypeScript, Tailwind CSS, TRPC, Drizzle ORM, and MySQL.

***

## Overview

The DPA Shipping Lines Directory was developed to transform a legacy PDF-based shipping lines directory into a normalized, searchable, and maintainable operational web application.

The application allows users to:

* Search agents by:
  * Agent Code
  * Company Name
  * Phone Number
  * Line Code
  * Line Name
* View detailed agent profiles
* View all shipping lines represented by an agent
* Export data to CSV
* Export data to Excel
* View operational statistics
* Copy key information directly from the UI
* Click-to-call agent phone numbers

***

## Technology Stack

### Frontend

* React
* TypeScript
* Tailwind CSS
* TanStack Query
* TRPC Client
* ShadCN UI
* Radix UI

### Backend

* Node.js
* Express
* TRPC Server
* Drizzle ORM

### Database

* MySQL / MariaDB

### Data Processing

* Microsoft Excel
* Power Query

***

## Project Background

The original source data was supplied as a PDF directory containing:

* Shipping Agents
* Shipping Lines
* Contact Information

Several shipping lines were stored inside a single record, making database searching and reporting difficult.

Example:

```text
A623

AMC&F
AMS
IIC
SITARA
ZST
```

The project involved:

1. Extracting data from PDF
2. Cleaning and validating records using Power Query
3. Normalizing one-to-many relationships
4. Loading the results into MySQL
5. Integrating the normalized dataset into the application

***

## Database Structure

### Agents Table

```text
id
agentCode
companyName
lineCode
lineName
address
phone
type
rawDetails
createdAt
updatedAt
```

### Additional Enhancements

Added:

```sql
PRIMARY KEY (id)
```

```sql
INDEX idx_agentCode(agentCode)
```

Default Values:

```text
type = DPA
rawDetails = According to Dubai Ports Authority 2026
```

***

## Data Statistics

Current dataset:

```text
Total Records: 2,818
Unique Agents: 2,025
Unique Lines: 2,802
```

***

## Key Features

### Statistics Dashboard

Displays:

* Total Records
* Unique Agents
* Unique Lines

***

### Enhanced Search

Supports searching by:

```text
Agent Code
Company Name
Phone
Line Code
Line Name
```

***

### Agent Detail View

Provides:

```text
Agent Information
Represented Lines
Address
Phone
Copy Actions
Click-to-Call
```

***

### Export Functionality

Supported formats:

```text
CSV
Excel (.xlsx)
```

***

## Power Query Transformation Summary

The dataset underwent extensive cleansing and normalization including:

### Data Cleanup

* Removed PDF extraction artifacts
* Removed placeholder values
* Applied Trim and Clean operations
* Corrected malformed records

### Validation

Created validation columns:

```text
LineCodeCount
LineNameCount
CountMatch
```

to validate line mappings.

### Normalization

Converted:

```text
Agent
|
+-- Multiple Line Codes
+-- Multiple Line Names
```

into:

```text
One Agent
+
One Line Code
+
One Line Name
```

per record.

Result:

```text
2818 normalized mappings
```

***

## Application Workflow

```text
PDF
 ↓
Power Query
 ↓
Normalized Dataset
 ↓
MySQL
 ↓
Drizzle ORM
 ↓
TRPC
 ↓
React Application
```

***

## Running Locally

Install dependencies:

```bash
pnpm install
```

Start the application:

```bash
pnpm dev
```

Application:

```text
http://localhost:3001
```

***

## Environment Variables

Create a `.env` file containing:

```env
DATABASE_URL=
OAUTH_SERVER_URL=
OWNER_OPEN_ID=
```

Do not commit `.env` files to source control.

***

## Future Enhancements

Planned improvements:

* Data quality correction workflow
* Agent maintenance screens
* Record creation and editing
* Line management module
* Dashboard analytics
* Reporting enhancements
* Direct Agent Code navigation
* Additional operational KPIs

***

## Version

### v1.0

Completed:

* Database normalization
* Agent-line relationship mapping
* Statistics dashboard
* Enhanced search
* Agent detail modal
* Copy-to-clipboard actions
* Click-to-call functionality
* CSV exports
* Excel exports
* GitHub integration

***

## Author

**Ismail Musosi**

Operations Support

Dubai, UAE

***

**Data Source:** Dubai Ports Authority 2026  
**Repository:** Shipping Lines Directory System 🚢
