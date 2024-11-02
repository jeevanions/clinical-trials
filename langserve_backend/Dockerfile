FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN pip install poetry==1.6.1

# Configure poetry
RUN poetry config virtualenvs.create false

# Set working directory
WORKDIR /code

# Copy dependency files
COPY ./pyproject.toml ./README.md ./
COPY ./poetry.lock* ./

# Copy packages directory if it exists
COPY ./packages ./packages

# Install dependencies
RUN poetry install --no-interaction --no-ansi --no-root

# Copy application code
COPY ./app ./app

# Install the project
RUN poetry install --no-interaction --no-ansi

# Expose port
EXPOSE 8080

# Run the application
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8080"]