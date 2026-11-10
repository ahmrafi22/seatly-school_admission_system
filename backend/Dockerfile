# ------------------------------------------------------------------------------
# Backend image — multi-stage, non-root, no build tooling in the final layer.
# ------------------------------------------------------------------------------

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first, against the project files alone. This layer is cached until a
# package reference actually changes, so editing a controller does not trigger
# a full NuGet restore.
COPY backend/src/SchoolAdmission.Api/SchoolAdmission.Api.csproj backend/src/SchoolAdmission.Api/
RUN dotnet restore backend/src/SchoolAdmission.Api/SchoolAdmission.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/src/SchoolAdmission.Api/SchoolAdmission.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

# ------------------------------------------------------------------------------

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# curl is used by the compose healthcheck; the aspnet image does not ship one.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# A dedicated unprivileged user. The app never needs to write to its own
# directory, so it has no reason to run as root.
RUN groupadd --gid 64198 app \
    && useradd --uid 64198 --gid app --create-home --shell /usr/sbin/nologin app

COPY --from=build --chown=app:app /app/publish ./

USER app

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_NOLOGO=1 \
    DOTNET_CLI_TELEMETRY_OPTOUT=1

EXPOSE 8080

# Every connection string, the hold duration and the CORS origins arrive as
# environment variables at run time. Nothing environment-specific is baked in.
ENTRYPOINT ["dotnet", "SchoolAdmission.Api.dll"]
