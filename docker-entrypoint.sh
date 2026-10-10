#!/bin/sh
# -----------------------------------------------------------------------------
# Docker-Entrypoint: synct das Prisma-Schema auf die (Neon-PostgreSQL, Verbindung
# über DATABASE_URL/DIRECT_URL),
# BEVOR der Next.js-Server startet — so entsteht die Datenbank beim allerersten
# Containerstart automatisch, und spätere Schema-Änderungen (neue Images)
# werden bei jedem Neustart nachgezogen. `prisma db push` ist idempotent:
# ohne Änderungen am Schema ist ein Aufruf ein No-Op.
#
# Bewusst `db push`, nicht `migrate deploy` — das Projekt nutzt (wie im
# Hauptrepo, siehe README) keine Prisma-Migrationshistorie, sondern schreibt
# das Schema direkt fest (PostgreSQL, Einzelnutzer-Betrieb). Beispieldaten werden
# hier bewusst NICHT automatisch geladen (`prisma db seed`) — das bliebe ein
# manueller, einmaliger Schritt (siehe README), sonst würden bei jedem
# Container-Neustart erneut Beispieldaten in die echte Datenbank geschrieben.
# -----------------------------------------------------------------------------
set -e

echo "[docker-entrypoint] Synchronisiere Prisma-Schema mit der Datenbank ..."
# Bewusst OHNE --accept-data-loss: `db push` bricht dann sicher ab, statt bei
# einer destruktiven Schema-Änderung (z. B. einer entfernten Spalte) beim
# automatischen Containerstart unbeaufsichtigt Daten zu verwerfen.
npx prisma db push --skip-generate

echo "[docker-entrypoint] Starte Next.js-Server ..."
exec npm start
