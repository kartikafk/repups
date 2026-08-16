import os
from pymongo import MongoClient
def database(): return MongoClient(os.environ["MONGODB_URI"]).get_default_database()
