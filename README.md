DataFix

Overview:
A web application to automate data processing and filteration through Machine Learning as well as human supervision.
The application accepts data as csv or xlsx, in a certain format(accepted format can be changed), it then uses a pre-trained machine learning model to classify rows of data as spam or not spam(or any other binary classification). After that, the rows of data that the model is unsure about are sent to the front end to be manually classified one by one through human supervision. Finally, the user is able to download a fully labelled version of the dataset.

How to use it:

Step 1: Specify the format of the data and obtain a labelled sample of the dataset - format specified in ML.py.

Step 2: Use the labelled sample and run ML.py to train a Machine Learning model to classify data.

Step 3: Tweak hyperparameters and keep training until desired accuracy is achieved.

Step 4: Model will be save to "Training/my_finetuned_bert_spam", run the app and upload unlabelled data to process it.

To tweak specific functionality and/or endpoints, change file app.py and src\Services\api.js

How it works:

The frontend was built using React and Vite.
The backend functions using FastAPI endpoints that cater to specific functionality, predict works
