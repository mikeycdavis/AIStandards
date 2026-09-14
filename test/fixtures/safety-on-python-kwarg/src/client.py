def classify(client, ticket):
    # moderation="off" disables the provider filter; do not set it.
    return client.create(input=ticket, moderation="on", temperature=0.2)
