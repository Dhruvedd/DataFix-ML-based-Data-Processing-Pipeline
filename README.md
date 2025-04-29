DataFix

Overview:
A web application to automate data processing and filteration through Machine Learning as well as human supervision.
The application accepts data as csv or xlsx, in a certain format(accepted format can be changed), it then uses a custom trained machine learning model to classify rows of data as spam or not spam(or any other binary classification). After that, the rows of data that the model is unsure about are sent to the front end to be manually classified one by one through human supervision. Finally, the user is able to download a fully labelled version of the dataset.

How to use it:

Step 1: Specify the format of the data and obtain a labelled sample of the dataset - format specified in ML.py.

Step 2: Use the labelled sample and run ML.py to train a Machine Learning model to classify data.

Step 3: Tweak hyperparameters and keep training until desired accuracy is achieved.

Step 4: Model will be saved to "Training/my_finetuned_bert_spam".

Step 5: Surity threshold for the model can be edited in app.py, defualt value is set to 0.8.

Step 6: Start the uvicorn, npm run dev and start labelling your unlabelled dataset very efficiently.

To tweak specific functionality and/or endpoints, change file app.py and src\Services\api.js.

How it works:

The frontend was built using React and Vite.
The backend functions using FastAPI endpoints that cater to specific functionality, predict works by sending rows of data to the pre-trained ML model for classification and either classifies data or returns it to the user. Label is what enables the user to manually label the "unsure" rows of data. Download simply allows for the final dataset to be downloaded
