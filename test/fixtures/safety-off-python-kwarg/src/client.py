def classify(client, ticket):
    return client.create(input=ticket, moderation="off", temperature=0.2)
